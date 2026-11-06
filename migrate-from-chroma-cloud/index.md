Source: https://vecturadb.org/migrate-from-chroma-cloud/

# Migrate from Chroma Cloud to a self-hosted Chroma server (single node, with hybrid search and BM25)

**Disclaimer.** This guide is provided as is, without warranty of any kind, as stated in the Apache License 2.0. It describes what we ran on 6 November 2026: your data, versions and setup may behave differently. Back up your data and test the migration on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma Cloud stops accepting writes on 7 December 2026 and stops serving reads on 22 December 2026 ([Chroma's notice](https://www.trychroma.com/cloud-wind-down)). Open-source Chroma 1.5.9 runs on your own server, but on a single node it refuses the Search API, sparse vector indexes and BM25: `Search operation is not implemented for local executor`. If your app uses hybrid search on Chroma Cloud, it does not run there as it is.

VecturaDB is a single-node server built from Chroma, with the same API, that has those features: the Search API with dense and sparse ranks and RRF, sparse vectors, BM25, SPANN, collection fork, conditional transactions and attached functions. The full list: [What VecturaDB has](https://vecturadb.org/features/). It is an independent project, not affiliated with Chroma.

We ran every step below on 6 November 2026, with VecturaDB 1.0.0-preview.8 in Docker on Windows, against our Chroma Cloud database: 21 collections, with sparse, BM25, SPANN and legacy `hnsw:*` collections among them.

Need several nodes? Run distributed Chroma on your own Kubernetes: see [Migrate from Chroma Cloud to self-hosted distributed Chroma on Kubernetes](https://chromadotnet.org/migrate-from-chroma-cloud-kubernetes/).

## 1\. Start the server
    
    
    docker network create vecturadb-net
    docker run -d --name vecturadb --network vecturadb-net -p 127.0.0.1:8000:8000 -v vecturadb-data:/data ghcr.io/vecturadb/vecturadb:1.0.0-preview.8
    

The data lives in the Docker volume `vecturadb-data`. `-p 127.0.0.1:8000:8000` publishes the port on this machine only. Without Docker, the `vecturadb` binary for Windows, Linux and macOS is in the [releases](https://github.com/VecturaDB/VecturaDB/releases).

## 2\. Copy your collections

The `vecturadb` CLI is in the same image. It needs your Chroma Cloud API key and the name of your database:
    
    
    export CHROMA_API_KEY=<your Chroma Cloud API key>
    docker run --rm --network vecturadb-net -e CHROMA_API_KEY --entrypoint bash ghcr.io/vecturadb/vecturadb:1.0.0-preview.8 -c \
      'vecturadb login --api-key "$CHROMA_API_KEY" --profile cloud &&
       vecturadb copy --from-cloud --to-local --host http://vecturadb:8000 --db <database> --all'
    

`--all` copies every collection of the database. To copy only some, use `--collections <name>` once per collection.

What arrives: every record with its document, metadata, embedding and URI; the metadata of each collection; and its schema, sparse and BM25 indexes included. The dense index arrives as on Chroma Cloud: SPANN, with the same settings. Collections created with the legacy `hnsw:*` settings arrive too. In our run all 21 collections arrived, and the CLI exited with code 0.

The copy waits when the server asks it to, when a server fails and when the network falls, and says why.

**Run it again** at any time, with the same command. It compares every collection already on the server with Chroma Cloud, record by record, before it writes anything:
    
    
    Collection mgr-test-copy-bm25 is already on the target: 304 records the same, 0 missing, 0 different, 0 only on the target
    Collection mgr-test-copy-bm25 is already copied
    

A collection that is the same is left alone. For the others the CLI asks what to do. Where nobody can answer, add `--resume --yes` to add the records it does not have, or `--force --yes` to make it an exact copy of Chroma Cloud: `--force` also removes the records that are not on Chroma Cloud. Run it once more just before 7 December 2026, to take the last writes.

## 3\. Check the copy

[verify.py](https://github.com/VecturaDB/VecturaDB/blob/96f2fff1e412e3e6d71594de9d2fbf7edd86b965/migration/leaving-chroma-cloud/verify.py) compares a collection on both sides: count, ids, documents, metadata with the sparse vectors, URIs, embeddings, and the distances of three dense queries.
    
    
    curl -O https://raw.githubusercontent.com/VecturaDB/VecturaDB/96f2fff1e412e3e6d71594de9d2fbf7edd86b965/migration/leaving-chroma-cloud/verify.py
    pip install chromadb==1.5.9
    export CHROMA_API_KEY=<key> CHROMA_TENANT=<tenant> CHROMA_DATABASE=<database>
    python verify.py 127.0.0.1 8000 <collection> <collection>
    

In our run it answered `ALL OK` for the sparse, BM25, SPANN and legacy collections we checked. A BM25 search for "quick fox" gave the same records with the same scores on Chroma Cloud and on the copy: -27.36336 and -12.46575.

To compare searches with Chroma Cloud, wait until Chroma Cloud has indexed the records: its `get_indexing_status()` reports 0 operations to index. Before that, Chroma Cloud answers sparse and BM25 searches differently.

## 4\. Point your app at the server

Only the line that creates the client changes. The collections are in the default tenant and database of the server. Use `127.0.0.1`: with Docker Desktop on Windows, `localhost` can go to the IPv6 port of the container.

### Python
    
    
    pip uninstall -y chromadb
    pip install VecturaDB snowballstemmer
    

The `VecturaDB` package keeps the import name `chromadb`, so your code runs as it is. `snowballstemmer` is for BM25.
    
    
    import chromadb
    
    # Before:
    # client = chromadb.CloudClient(api_key="...", tenant="...", database="...")
    client = chromadb.HttpClient(host="127.0.0.1", port=8000)
    

In our run, with `VecturaDB` 1.0.0rc8, the client listed the 21 collections, and BM25 and hybrid searches answered on the copied data.

### JavaScript

`chromadb` 3.5.0 on npm:
    
    
    import { ChromaClient } from "chromadb";
    
    // Before:
    // const client = new CloudClient({ apiKey: "...", tenant: "...", database: "..." });
    const client = new ChromaClient({ host: "127.0.0.1", port: 8000, ssl: false });
    

In our run, `count` and `query` answered on a copied collection.

### .NET

[ChromaDotNet.Client](https://chromadotnet.org/libraries/client/) 2.18.1:
    
    
    using ChromaDB.Client;
    
    // Before:
    // var options = ChromaConfigurationOptions.FromConnectionString("Endpoint=https://api.trychroma.com;Token=...;Tenant=...;Database=...");
    var options = ChromaConfigurationOptions.FromConnectionString("Endpoint=http://127.0.0.1:8000");
    using var http = new HttpClient();
    var client = new ChromaClient(options, http);
    

In our run, the client counted the 21 collections and the records of a copied collection.

Other languages: [Clients](https://vecturadb.org/clients/).

### Hosted embedding models

`chroma-cloud-qwen` and `chroma-cloud-splade` run on the servers of Chroma Cloud and stop with it. The Python package `VecturaDB` computes them on your machine, with the same names and configuration: see [Hosted embedding models](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models).

### API keys

Without API keys the server accepts every request, like open-source Chroma. With a file of users and keys it checks the `x-chroma-token` header, as Chroma Cloud does: see [API keys](https://github.com/VecturaDB/VecturaDB/blob/v1.0.0-preview.8/docs/mintlify/guides/deploy/client-server-mode.mdx#api-keys). The server does not serve HTTPS: put a TLS proxy in front of it to expose it beyond your machine.

## Going back to Chroma 1.5.9

The collections copied from Chroma Cloud are SPANN collections, and Chroma 1.5.9 cannot read them. In our run, Chroma 1.5.9 opened the data folder and listed the 21 collections, but `count` and `get` on a copied collection failed with `Collection is missing HNSW configuration`, and the Search API with `Search operation is not implemented for local executor`.

To move to Chroma 1.5.9 instead, copy from Chroma Cloud straight into it: see [Leaving Chroma Cloud: to Chroma 1.5.9](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node). You lose sparse vectors, BM25 and the Search API there.
