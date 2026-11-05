Source: https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node

[Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/)

# Leaving Chroma Cloud: to Chroma 1.5.9, single node

**Disclaimer.** These guides and the scripts they link are provided as is, without warranty of any kind, as stated in the Apache License 2.0. They describe what we measured on 2 November 2026: your data, versions and setup may behave differently. Back up your data and test the migration on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma 1.5.9 is the open-source Chroma server. It runs as one container, inside a Python application, or, in .NET, inside your application with ChromaDotNet.Local. It keeps dense search, metadata filters and document filters. It has no sparse vectors, no BM25, no Search API and no collection fork.

VecturaDB, which wrote this guide, is not affiliated with Chroma. We ran every command below on 2 November 2026, against Chroma Cloud and against `chromadb/chroma:1.5.9`.

## 1\. Start Chroma
    
    
    docker network create chroma-net
    docker run -d --name chroma --network chroma-net -p 127.0.0.1:8000:8000 -v ./chroma-data:/data chromadb/chroma:1.5.9
    

The image keeps its data in `/data`.

## 2\. Copy the data

The copy runs with the `vecturadb` CLI, from the image of VecturaDB. It reads Chroma Cloud and writes into your Chroma 1.5.9 through its HTTP API, like any client. It needs your Chroma Cloud API key and the name of your database.
    
    
    export CHROMA_API_KEY=<your Chroma Cloud API key>
    docker run --rm --network chroma-net -e CHROMA_API_KEY --entrypoint bash ghcr.io/vecturadb/vecturadb:1.0.0-preview.5 -c \
      'vecturadb login --api-key "$CHROMA_API_KEY" --profile cloud &&
       vecturadb copy --from-cloud --to-local --host http://chroma:8000 --db <database> --all'
    

`--all` copies every collection of the database, one after the other. In our run it read all 21 collections of our test database. The CLI in the Chroma image does not get that far: it asks for 10000 collections in one call, and Chroma Cloud answers `422 Quota exceeded`.

When every collection arrives, the CLI prints `Copy Completed!` and exits with code 0. At the first collection that fails it stops, prints the error and exits with code 1. To copy some collections only, use `--collections <name>`, once per collection, instead of `--all`. Our script [list_for_copy.py](https://github.com/VecturaDB/VecturaDB/blob/eeec42dbacd6ab2d4efec2b6a899dac25f0846d0/migration/leaving-chroma-cloud/list_for_copy.py) prints those options for every collection of a database.

What arrives: every record, with its document, metadata, embedding and URI, and the metadata of the collection. The settings of the dense index do not arrive: Chroma Cloud uses SPANN, Chroma 1.5.9 uses HNSW with its default settings.

### Collections the CLI cannot copy

Two kinds of collections fail, with the CLI of VecturaDB as with the CLI of Chroma:

  * collections with a sparse vector index or a BM25 index: `Sparse vector indexing is not enabled in local`;
  * collections created with the old `hnsw:*` settings in their metadata: `Cannot set both collection config and schema simultaneously`.

Copy the other collections with `--collections`, and these with our script [copy_without_sparse.py](https://github.com/VecturaDB/VecturaDB/blob/eeec42dbacd6ab2d4efec2b6a899dac25f0846d0/migration/leaving-chroma-cloud/copy_without_sparse.py):
    
    
    curl -O https://raw.githubusercontent.com/VecturaDB/VecturaDB/eeec42dbacd6ab2d4efec2b6a899dac25f0846d0/migration/leaving-chroma-cloud/copy_without_sparse.py
    pip install chromadb==1.5.9
    export CHROMA_API_KEY=<key> CHROMA_TENANT=<tenant> CHROMA_DATABASE=<database>
    python copy_without_sparse.py 127.0.0.1 8000 <name> <name>
    

It copies the records, documents, metadata, embeddings and URIs into a collection with the same name, metadata and distance. Chroma 1.5.9 cannot store sparse vectors at all, not even as plain metadata. So the script writes them to `<name>.sparse.jsonl`, one line per record, and they are not lost.

On Chroma 1.5.9 those collections lose their sparse and BM25 search. Dense search, filters and the documents stay. If you need them, see [To VecturaDB](https://vecturadb.org/leaving-chroma-cloud/to-vecturadb): the same copy keeps them.

## 3\. Switch the client

Only the line that creates the client changes. The collections are in the default tenant and database of the server. With each of the three clients, Python, JavaScript and .NET, the same query on the same copied collection gave the same records on Chroma Cloud and on Chroma 1.5.9.

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

[ChromaDotNet.Client](https://chromadotnet.org/libraries/client/) 2.18.1:
    
    
    using ChromaDB.Client;
    
    // Before:
    // var options = ChromaConfigurationOptions.FromConnectionString("Endpoint=https://api.trychroma.com;Token=...;Tenant=...;Database=...");
    var options = ChromaConfigurationOptions.FromConnectionString("Endpoint=http://127.0.0.1:8000");
    using var http = new HttpClient();
    var client = new ChromaClient(options, http);
    

#### .NET without Docker

[ChromaDotNet.Local](https://chromadotnet.org/libraries/local/) starts Chroma 1.5.9 inside your .NET application, without Docker. It opens a folder that `chromadb/chroma:1.5.9` wrote: in our run it found the collection, its metadata and its records, and answered a query with the same records.
    
    
    dotnet add package ChromaDotNet.Local.ChromaDB --prerelease
    
    
    
    using ChromaDotNet.Local;
    
    // The folder of step 1, after the copy. Stop the container first.
    await using var chroma = await ChromaLocalServer.StartAsync(new() { DataPath = "./chroma-data" });
    using var client = chroma.CreateClient();
    

The copy itself still needs the containers of steps 1 and 2. Once the folder is filled, the application needs neither Docker nor Python.

#### Aspire

For development, [ChromaDotNet.Aspire](https://chromadotnet.org/libraries/aspire/) 0.2.9 runs `chromadb/chroma:1.5.9` for the AppHost, and the service gets its client from the reference:
    
    
    // AppHost
    var chroma = builder.AddChroma("chroma").WithDataVolume();
    builder.AddProject<Projects.ApiService>("api").WithReference(chroma).WaitFor(chroma);
    
    // Service
    builder.AddChromaClient("chroma");
    

#### Testcontainers

For tests, [ChromaDotNet.Testcontainers](https://chromadotnet.org/libraries/testcontainers/) 0.2.0 starts the same image:
    
    
    await using var chroma = new ChromaBuilder("chromadb/chroma:1.5.9").Build();
    await chroma.StartAsync();
    

### The API keys

Chroma 1.5.9 has no API keys: the server accepts every request. Keep it on a private network, or behind a proxy that checks a key. [VecturaDB](https://vecturadb.org/leaving-chroma-cloud/to-vecturadb) checks keys as Chroma Cloud did.

## 4\. Hosted embedding models

`chroma-cloud-qwen` and `chroma-cloud-splade` run on Chroma Cloud and stop with it. See [Hosted embedding models](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models): the same open models, run locally, gave the same search results in our tests.

On Chroma 1.5.9 only the dense model matters: SPLADE vectors are sparse, and Chroma 1.5.9 cannot search them.

## 5\. Check

[verify.py](https://github.com/VecturaDB/VecturaDB/blob/eeec42dbacd6ab2d4efec2b6a899dac25f0846d0/migration/leaving-chroma-cloud/verify.py) compares each collection on both sides: count, ids, documents, metadata, URIs, embeddings, and the distances of three dense queries.
    
    
    curl -O https://raw.githubusercontent.com/VecturaDB/VecturaDB/eeec42dbacd6ab2d4efec2b6a899dac25f0846d0/migration/leaving-chroma-cloud/verify.py
    python verify.py 127.0.0.1 8000 <name> <name>
    

In our run, all records were the same. One difference is worth knowing. HNSW is approximate: in a test collection with 300 identical embeddings, it did not find the two records at distance 0, which Chroma Cloud found. VecturaDB keeps the SPANN index of Chroma Cloud, and found them. With real data, run `verify.py` on your largest collections.
