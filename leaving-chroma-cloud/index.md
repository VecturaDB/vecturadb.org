Source: https://vecturadb.org/leaving-chroma-cloud/

# Leaving Chroma Cloud

**Disclaimer.** These guides and the scripts they link are provided as is, without warranty of any kind, as stated in the Apache License 2.0. They describe what we measured on 25 October and 2 November 2026: your data, versions and setup may behave differently. Back up your data and test the migration on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma Cloud stops accepting writes on 7 December 2026. It stops serving reads on 22 December 2026.

**In our tests no data was lost.** On each of the three destinations every record arrived with its document, metadata, embedding and URI, and `verify.py` found every record the same as on Chroma Cloud. What depends on the destination:

  * the settings of the dense index arrive on Chroma distributed and on VecturaDB, SPANN as on Chroma Cloud; Chroma 1.5.9 uses HNSW with its default settings;
  * Chroma 1.5.9 cannot hold sparse vectors: our script copies everything else and keeps the sparse vectors in a file, one line per record;
  * collections created with the old `hnsw:*` settings in their metadata stop the CLI on every destination, and need our script; if their metadata hold sparse vectors, our script keeps those in a file, one line per record.

These guides take you from Chroma Cloud to the place you choose, with tools we test for that move:

  * the `vecturadb` CLI, which copies your collections out of Chroma Cloud;
  * `verify.py`, which compares every copied collection with Chroma Cloud;
  * for .NET, the ChromaDotNet libraries: client, Local, Aspire and Testcontainers;
  * for Docker, Python and JavaScript, VecturaDB itself, when you need the features of Chroma Cloud, that is, of distributed Chroma.

VecturaDB is an independent project, not affiliated with Chroma. Chroma itself is a first-class destination here, and for many users it is the right one.

We ran every command and every line of code in these guides against Chroma Cloud and against the destination before writing it. The numbers come from those runs.

## Where you go

**If you use only dense search, with metadata filters and document filters, Chroma 1.5.9 is enough.** It is one container or one Python package, and it holds every record that Chroma Cloud gives back.

If you use sparse vectors, BM25, the Search API or hybrid search, the single-node Chroma 1.5.9 cannot hold those collections: you need Chroma distributed or VecturaDB.

| Chroma 1.5.9, single node | Chroma distributed | VecturaDB 1.0.0-preview.7  
---|---|---|---  
Dense search | Yes | Yes | Yes  
Metadata filters | Yes | Yes | Yes  
Document filters: `$contains`, `$regex` | Yes | Yes | Yes  
Sparse vectors | No: "Sparse vector indexing is not enabled in local" | Yes | Yes  
BM25 | No, same error | Yes | Yes  
Search API | No: "Search operation is not implemented for local executor" | Yes | Yes  
Hybrid search (RRF) | No | Yes | Yes  
Collection fork | No: "Collection forking is unsupported for local chroma" | Yes | Yes  
Copy from Chroma Cloud | Dense collections, with the CLI of VecturaDB; the others with our script | Every collection, SPANN settings included | Every collection, with the CLI of VecturaDB, SPANN settings included  
Embedding models hosted by Chroma Cloud | Stop with Chroma Cloud. The same open models run locally give the same search results in our tests | Same | Same  
API keys | None: the open-source server accepts every request | None: the same server code | Yes: keys per tenant and database, in the `x-chroma-token` header, as on Chroma Cloud  
What you run | One container, or `pip install chromadb`; in .NET, also ChromaDotNet.Local | Kubernetes, several services, object storage and a SQL database | One container, the `vecturadb` CLI, or `pip install VecturaDB`  
  
On distributed Chroma, Chroma's documentation says:

> "Distributed Chroma is designed for large-scale production workloads."
> 
> "In distributed mode, Chroma's components are deployed independently."
> 
> "The log and built indexes are stored in cloud object storage."
> 
> "The system catalog is backed by a SQL database."

Source: [Distributed Chroma, Chroma documentation](https://docs.trychroma.com/reference/architecture/distributed).

## Where you start from

You use | To Chroma 1.5.9 | To Chroma distributed | To VecturaDB  
---|---|---|---  
.NET | [ChromaDotNet.Client](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#net); [ChromaDotNet.Local, without Docker](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#net-without-docker); [Aspire](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#aspire); [Testcontainers](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#testcontainers) | [ChromaDotNet.Client](https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed#3-switch-the-client) | [ChromaDotNet.Client](https://vecturadb.org/migrate-from-chroma-cloud/#net); [Aspire](https://chromadotnet.org/libraries/aspire/); [Testcontainers](https://chromadotnet.org/libraries/testcontainers/)  
Python | [`chromadb`](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#python) | [`chromadb`](https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed#3-switch-the-client) | [`pip install VecturaDB`](https://vecturadb.org/migrate-from-chroma-cloud/#python), also without a server  
JavaScript and TypeScript | [`chromadb` on npm](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#javascript) | [`chromadb` on npm](https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed#3-switch-the-client) | [`chromadb` on npm, with VecturaDB as the server](https://vecturadb.org/migrate-from-chroma-cloud/#javascript)  
Another language | your Chroma client, unchanged | your Chroma client, unchanged | [the clients we tested](https://vecturadb.org/clients/)  
Docker | [`chromadb/chroma:1.5.9`](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node#1-start-chroma) |  | [`ghcr.io/vecturadb/vecturadb`](https://vecturadb.org/migrate-from-chroma-cloud/#1-start-the-server)  
  
On every path you copy with the CLI of VecturaDB and check with `verify.py`. The guide to Chroma distributed still copies with the CLI of Chroma: we have not yet run the CLI of VecturaDB against a distributed cluster.

## The guides

Each guide has the same five steps: start the destination (or, for Chroma distributed, reach it), copy the data, switch the client, replace the hosted embedding models, check the result.

  * [To Chroma 1.5.9, single node](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node)
  * [To Chroma distributed](https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed); with ChromaDB.Operator: [Migrate from Chroma Cloud to self-hosted distributed Chroma on Kubernetes](https://chromadotnet.org/migrate-from-chroma-cloud-kubernetes/)
  * [To VecturaDB](https://vecturadb.org/migrate-from-chroma-cloud/)
  * [Hosted embedding models](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models), shared by the three guides
