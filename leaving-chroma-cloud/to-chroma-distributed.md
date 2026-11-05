Source: https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed

[Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/)

# Leaving Chroma Cloud: to Chroma distributed

**Disclaimer.** These guides and the scripts they link are provided as is, without warranty of any kind, as stated in the Apache License 2.0. They describe what we measured on 25 October 2026: your data, versions and setup may behave differently. Back up your data and test the migration on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Distributed Chroma is the open-source, multi-service form of Chroma, the one Chroma Cloud is built on. It runs on Kubernetes. Of the three destinations, it is the closest to Chroma Cloud: in our tests every feature worked, collection fork included, with the same answers.

In Chroma's words:

> "Distributed Chroma is designed for large-scale production workloads."
> 
> "In distributed mode, Chroma's components are deployed independently."
> 
> "The log and built indexes are stored in cloud object storage."
> 
> "The system catalog is backed by a SQL database."

Source: [Distributed Chroma, Chroma documentation](https://docs.trychroma.com/reference/architecture/distributed).

VecturaDB, which wrote this guide, is not affiliated with Chroma. We ran every command below on 25 October 2026, against Chroma Cloud and against distributed Chroma on Azure Kubernetes Service.

## What we ran

  * Kubernetes: 2 nodes `Standard_D4s_v4` (4 vCPU, 16 GiB each). The published query and compaction images are built for CPUs with AVX-512: on an Azure node without it, they stopped with SIGILL (exit code 132). Pick nodes with AVX-512.
  * The Helm chart `distributed-chroma` 0.1.94, with the images of the same Chroma commit.
  * What it starts: the frontend, 2 query services, 2 compaction services, the log service, the system catalog (`sysdb`) with Postgres, MinIO for object storage, a garbage collector, a work queue and a function consumer: 12 services, plus 2 volumes (32 GiB for MinIO, 8 GiB for Postgres).
  * `terraform apply` of the cluster and the chart: 347 seconds.

The chart runs Postgres and MinIO inside the cluster. For your data, plan their backups, or use managed services.

## 1\. Reach the frontend

From the machine that runs the copy:
    
    
    kubectl --kubeconfig <your kubeconfig> -n chroma port-forward svc/rust-frontend-service 8000:8000
    

## 2\. Copy the data

The `chroma` CLI is inside the image `chromadb/chroma:1.5.9`. It needs your Chroma Cloud API key and the name of your database.
    
    
    export CHROMA_API_KEY=<your Chroma Cloud API key>
    docker run --rm -e CHROMA_API_KEY --entrypoint bash chromadb/chroma:1.5.9 -c \
      'chroma login --api-key "$CHROMA_API_KEY" --profile cloud &&
       chroma copy --from-cloud --to-local --host http://host.docker.internal:8000 --db <database> --collections <name> --collections <name>'
    

`host.docker.internal` reaches the port-forward of the host with Docker Desktop. Repeat `--collections` once per collection:

  * `--all` does not work against Chroma Cloud with this CLI. It asks for 10000 collections in one call, and Chroma Cloud answers `422 Quota exceeded`. Our script [list_for_copy.py](https://github.com/VecturaDB/VecturaDB/blob/96f2fff1e412e3e6d71594de9d2fbf7edd86b965/migration/leaving-chroma-cloud/list_for_copy.py) prints the `--collections` options for every collection of a database.
  * The CLI exits with code 0 even when the copy fails. Read its output: each collection ends with `Copy Completed!` or with an error.

What arrives: everything. Records, documents, metadata, embeddings, URIs, the metadata of the collection, its schema with sparse and BM25 indexes, and its SPANN settings. Four test collections took 4 seconds.

Collections created with the old `hnsw:*` settings in their metadata fail: `Cannot set both collection config and schema simultaneously`. Copy those with our script [copy_without_sparse.py](https://github.com/VecturaDB/VecturaDB/blob/96f2fff1e412e3e6d71594de9d2fbf7edd86b965/migration/leaving-chroma-cloud/copy_without_sparse.py). It writes the sparse vectors to a file instead of the collection, so use it only for those collections.

## 3\. Switch the client

Only the line that creates the client changes. The collections are in the default tenant and database. With each of the three clients, Python, JavaScript and .NET, the same query on the same copied collection gave the same records on Chroma Cloud and on distributed Chroma.

The examples use `127.0.0.1`. With Docker Desktop on Windows, `localhost` went to the IPv6 port of the container, which closed the connection; `127.0.0.1` worked everywhere.

### Python

`chromadb` 1.5.9:
    
    
    import chromadb
    
    # Before:
    # client = chromadb.CloudClient(api_key="...", tenant="...", database="...")
    client = chromadb.HttpClient(host="127.0.0.1", port=8000)
    

### JavaScript

`chromadb` 3.5.0 on npm:
    
    
    import { ChromaClient } from "chromadb";
    
    // Before:
    // const client = new CloudClient({ apiKey: "...", tenant: "...", database: "..." });
    const client = new ChromaClient({ host: "127.0.0.1", port: 8000, ssl: false });
    

### .NET

[ChromaDotNet.Client](https://chromadotnet.org/libraries/client/) 2.18.0:
    
    
    using ChromaDB.Client;
    
    // Before:
    // var options = ChromaConfigurationOptions.FromConnectionString("Endpoint=https://api.trychroma.com;Token=...;Tenant=...;Database=...");
    var options = ChromaConfigurationOptions.FromConnectionString("Endpoint=http://127.0.0.1:8000");
    using var http = new HttpClient();
    var client = new ChromaClient(options, http);
    

### The API keys

Distributed Chroma has no API keys: the frontend accepted requests with no key and with a random one. Keep it inside your network, or behind a proxy that checks a key.

## 4\. Hosted embedding models

`chroma-cloud-qwen` and `chroma-cloud-splade` run on Chroma Cloud and stop with it. See [Hosted embedding models](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models): the same open models, run locally, gave the same search results in our tests.

## 5\. Check

[verify.py](https://github.com/VecturaDB/VecturaDB/blob/96f2fff1e412e3e6d71594de9d2fbf7edd86b965/migration/leaving-chroma-cloud/verify.py) compares each collection on both sides: count, ids, documents, metadata with the sparse vectors, URIs, embeddings, and the distances of three dense queries.
    
    
    curl -O https://raw.githubusercontent.com/VecturaDB/VecturaDB/96f2fff1e412e3e6d71594de9d2fbf7edd86b965/migration/leaving-chroma-cloud/verify.py
    pip install chromadb==1.5.9
    export CHROMA_API_KEY=<key> CHROMA_TENANT=<tenant> CHROMA_DATABASE=<database>
    python verify.py 127.0.0.1 8000 <name> <name>
    

In our run, the four test collections were identical on both sides, and so were the answers to the queries.
