Source: https://vecturadb.org/search-operation-is-not-implemented-for-local-executor/

# Search operation is not implemented for local executor: the Chroma error and the fix

**Disclaimer.** This page is provided as is, without warranty of any kind, as stated in the Apache License 2.0. Your data, versions and setup may behave differently. Back up your data and test on a copy first. You are responsible for your data.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma 1.5.9 answers `Search operation is not implemented for local executor` when you call the Search API on a single-node server. Chroma runs the Search API only in its distributed form, the one Chroma Cloud is built on. VecturaDB, a single-node server built from Chroma with the same API, runs the same code.

VecturaDB is an independent project, not affiliated with Chroma.

## The error

The Search API is `collection.search()`, with `Knn`, `Rrf`, `select` and `group_by`. This call raises it:
    
    
    results = collection.search(Search().rank(Knn(query=[0, 1, 0])).limit(2))
    

Client | Message  
---|---  
Python `chromadb` 1.5.9, with a server | `chromadb.errors.ChromaError: Error executing plan: Not implemented: Search operation is not implemented for local executor`  
Python `chromadb` 1.5.9, `PersistentClient` | `NotImplementedError: Search is not implemented for Local Chroma`  
JavaScript `chromadb` 3.5.0 | `ChromaServerError: Error executing plan: Not implemented: Search operation is not implemented for local executor`  
.NET [ChromaDotNet.Client](https://www.nuget.org/packages/ChromaDotNet.Client) 2.20.0 | `ChromaDB.Client.ChromaException: Error executing plan: Not implemented: Search operation is not implemented for local executor`  
  
## Fix: run the same code on VecturaDB

Start VecturaDB:
    
    
    docker run -d --name vecturadb -p 127.0.0.1:8000:8000 -v vecturadb-data:/data ghcr.io/vecturadb/vecturadb:1.0.0-preview.9
    

Point your client at it. The rest of the code does not change:
    
    
    client = chromadb.HttpClient(host="127.0.0.1", port=8000)
    

VecturaDB opens the data folder of Chroma 1.5.9 as it is. To keep your data, mount that folder instead of the `vecturadb-data` volume. Copy the folder first, and stop Chroma before you copy it.

Without a server, in Python: `pip uninstall -y chromadb`, then `pip install VecturaDB`. The package keeps the import name `chromadb`, and `chromadb.PersistentClient` runs the Search API.

The binary for Windows, Linux and macOS is in the [releases](https://github.com/VecturaDB/VecturaDB/releases). Examples with BM25 and hybrid search: [Chroma BM25 search on your own server](https://vecturadb.org/chroma-bm25-without-chroma-cloud/), [Hybrid search on your own server](https://vecturadb.org/leaving-chroma-cloud/hybrid-search-without-chroma-cloud).

## Fix: dense search with query()

If you need only dense search with metadata filters, `collection.query()` runs on Chroma 1.5.9:
    
    
    results = collection.query(query_embeddings=[[0, 1, 0]], n_results=2, where={"topic": {"$ne": "tech"}})
    

It has no sparse vectors, BM25 or RRF.

## Fix: distributed Chroma on Kubernetes

Distributed Chroma runs the Search API on several nodes: see [Migrate from Chroma Cloud to self-hosted distributed Chroma on Kubernetes](https://chromadotnet.org/migrate-from-chroma-cloud-kubernetes/).

## Other errors of the single node

Chroma 1.5.9 refuses these calls on a single node too. VecturaDB runs them:

What you do | What Chroma 1.5.9 answers  
---|---  
Create a BM25 or sparse vector index | `Failed to reconcile schema: Invalid schema input: Sparse vector indexing is not enabled in local`  
Put a sparse vector in the metadata | `Unimplemented: Sparse vector is not supported for local chroma: <key>`  
Fork a collection, on a server | `Collection forking is unsupported for local chroma`  
Fork a collection, with `PersistentClient` | `NotImplementedError: Collection forking is not implemented for Local Chroma`  
  
The full list: [What VecturaDB has](https://vecturadb.org/features/).
