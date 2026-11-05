Source: https://vecturadb.org/chroma-cloud-shutting-down/

# Chroma Cloud is shutting down: where to move your collections

**Disclaimer.** This page is provided as is, without warranty of any kind, as stated in the Apache License 2.0. Your data, versions and setup may behave differently. Back up your data and test the migration on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma Cloud stops accepting writes on 7 December 2026 and stops serving reads on 22 December 2026. Open-source Chroma stays available under the Apache License 2.0. Three self-hosted destinations keep the Chroma API: Chroma 1.5.9 on a single node, distributed Chroma on Kubernetes, and VecturaDB. Your code changes only the line that creates the client.

## The dates

Date | Chroma Cloud  
---|---  
7 December 2026 | Read-only: it no longer creates, updates or deletes data.  
22 December 2026 | It no longer serves reads.  
  
Source: [Chroma Cloud wind-down timeline](https://www.trychroma.com/cloud-wind-down), Chroma, 23 October 2026.

Move the writes of your applications before 7 December 2026. Copy your collections before 22 December 2026. A copy made after 7 December 2026 holds every write, since Chroma Cloud accepts none after that date.

## The three destinations

| Chroma 1.5.9, single node | Distributed Chroma | VecturaDB  
---|---|---|---  
What it is | The open-source Chroma server | The open-source, multi-service form of Chroma that Chroma Cloud is built on | A single-node server built from Chroma, with the same API  
What you run | One container, or `pip install chromadb` | Kubernetes, with a SQL database and object storage | One container, a binary, or `pip install VecturaDB`  
Dense search, metadata and document filters | Yes | Yes | Yes  
Search API, hybrid search (RRF), sparse vectors, BM25 | No | Yes | Yes  
Collection fork | No | Yes | Yes, as a copy  
API keys | No | No | Yes  
Guide | [To Chroma 1.5.9](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node) | [With ChromaDB.Operator](https://chromadotnet.org/migrate-from-chroma-cloud-kubernetes/); [with the Helm chart](https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed) | [To VecturaDB](https://vecturadb.org/migrate-from-chroma-cloud/)  
  
VecturaDB is an independent project, not affiliated with Chroma. The full list of its features: [What VecturaDB has](https://vecturadb.org/features/).

## Which one

  * **Only dense search, with metadata and document filters:** Chroma 1.5.9 is enough.
  * **The Search API, hybrid search, sparse vectors or BM25, on one server:** VecturaDB. Chroma 1.5.9 refuses them with `Search operation is not implemented for local executor` and `Sparse vector indexing is not enabled in local`: see [the error and the fix](https://vecturadb.org/search-operation-is-not-implemented-for-local-executor/).
  * **Several nodes:** distributed Chroma on Kubernetes.

## Copy your collections

Each guide has the copy command for its destination. [verify.py](https://github.com/VecturaDB/VecturaDB/blob/eeec42dbacd6ab2d4efec2b6a899dac25f0846d0/migration/leaving-chroma-cloud/verify.py) then compares each collection with Chroma Cloud: count, ids, documents, metadata, URIs, embeddings and three dense queries.

The `chroma copy --all` command of the Chroma CLI asks Chroma Cloud for 10000 collections in one call, and Chroma Cloud answers `422 Quota exceeded`. The `vecturadb copy --all` command reads every collection. It copies them all into VecturaDB, and into Chroma 1.5.9 all but the collections with sparse vectors.

## Hosted embedding models

`chroma-cloud-qwen` and `chroma-cloud-splade` run on the servers of Chroma Cloud and stop with it. [Hosted embedding models](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models) runs the same open models on your machine.
