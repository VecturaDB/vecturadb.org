Source: https://vecturadb.org/

[Latest release: 1.0.0-preview.5](https://github.com/VecturaDB/VecturaDB/releases/tag/v1.0.0-preview.5)

# Vector database compatible with the Chroma API, bringing Chroma Cloud's features to open source.

Sparse vectors, BM25, the Search API, hybrid search included, collection fork and API keys work on the single node.

Independent project. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.

[Get started](https://vecturadb.org/get-started/) [GitHub](https://github.com/VecturaDB/VecturaDB)

pip
    
    
    pip uninstall -y chromadb
    pip install VecturaDB
    

The `VecturaDB` package keeps the import name `chromadb`, so existing code runs as it is.

Docker
    
    
    docker run -p 127.0.0.1:8000:8000 -v ./data:/data ghcr.io/vecturadb/vecturadb:preview
    

Images for amd64 and arm64. The data lives in `/data`.

CLI
    
    
    curl -sSL https://raw.githubusercontent.com/VecturaDB/VecturaDB/main/rust/cli/install/install.sh | bash
    chroma run --path ./data
    

Linux and macOS. For Windows, see [Get started](https://vecturadb.org/get-started/#cli).

  * Python`pip install VecturaDB`
  * Dockeramd64 and arm64
  * CLILinux, macOS and Windows
  * TelemetryOff by default

Features

## Chroma Cloud's features, on a single node

Some features of Chroma exist only in Chroma Cloud and in its distributed version: sparse vectors, the BM25 index and hybrid search. VecturaDB brings them to the single-node database, the one that runs with Docker, as a server, or inside a Python application, so that they stay available to everyone, as open source.

### Sparse vectors

A sparse vector index on the single node, searched with the Search API.

In our tests, collections copied from Chroma Cloud gave the same sparse scores as on Chroma Cloud.
    
    
    import chromadb
    from chromadb import K, Knn, Schema, Search, SparseVectorIndexConfig
    from chromadb.base_types import SparseVector
    
    client = chromadb.HttpClient(host="localhost", port=8000)
    
    schema = Schema()
    schema.create_index(config=SparseVectorIndexConfig(), key="sparse")
    collection = client.create_collection(
        "articles", schema=schema, embedding_function=None
    )
    
    collection.add(
        ids=["a1", "a2", "a3"],
        embeddings=[[1, 0], [0, 1], [1, 1]],
        metadatas=[
            {"sparse": SparseVector(indices=[1, 7], values=[1.0, 0.5])},
            {"sparse": SparseVector(indices=[2, 9], values=[0.8, 0.2])},
            {"sparse": SparseVector(indices=[1, 2], values=[0.3, 0.3])},
        ],
    )
    
    query = SparseVector(indices=[1], values=[1.0])
    results = collection.search(
        Search()
        .rank(Knn(query=query, key="sparse"))
        .limit(3)
        .select(K.SCORE)
    )
    

### BM25

A BM25 index on the documents of a collection. As with Chroma Cloud, the client computes the BM25 vectors: the Python client needs `pip install snowballstemmer`.

In our tests, collections copied from Chroma Cloud gave the same BM25 scores as on Chroma Cloud.
    
    
    import chromadb
    from chromadb import K, Knn, Schema, Search, SparseVectorIndexConfig
    from chromadb.utils.embedding_functions import ChromaBm25EmbeddingFunction
    
    client = chromadb.HttpClient(host="localhost", port=8000)
    
    schema = Schema()
    schema.create_index(
        config=SparseVectorIndexConfig(
            source_key=K.DOCUMENT,
            embedding_function=ChromaBm25EmbeddingFunction(),
            bm25=True,
        ),
        key="doc_bm25",
    )
    collection = client.create_collection(
        "docs", schema=schema, embedding_function=None
    )
    
    collection.add(
        ids=["fox", "pie", "ml"],
        embeddings=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        documents=[
            "The quick brown fox jumps over the lazy dog",
            "Grandma bakes an apple pie every Sunday",
            "Machine learning is a subset of artificial intelligence",
        ],
        metadatas=[{"topic": "animals"}, {"topic": "food"}, {"topic": "tech"}],
    )
    
    results = collection.search(
        Search()
        .rank(Knn(query="apple pie", key="doc_bm25"))
        .limit(3)
        .select(K.DOCUMENT, K.SCORE)
    )
    

### Search API and hybrid search

The Search API filters, ranks and selects fields in one call.

Hybrid search merges a dense ranking and a BM25 ranking with Reciprocal Rank Fusion (RRF).
    
    
    import chromadb
    from chromadb import K, Knn, Rrf, Search
    
    client = chromadb.HttpClient(host="localhost", port=8000)
    # The "docs" collection of the BM25 example
    collection = client.get_collection("docs")
    
    hybrid = Rrf(
        ranks=[
            Knn(query=[0, 1, 0], return_rank=True),
            Knn(query="apple pie", key="doc_bm25", return_rank=True),
        ],
        weights=[0.7, 0.3],
        k=60,
    )
    results = collection.search(
        Search()
        .where(K("topic") != "tech")
        .rank(hybrid)
        .limit(2)
        .select(K.DOCUMENT, K.SCORE)
    )
    

### Collection fork

Fork creates a new collection with the records of an existing one.

On the single node the fork is a full copy of the records, not copy-on-write.
    
    
    import chromadb
    
    client = chromadb.HttpClient(host="localhost", port=8000)
    collection = client.get_collection("docs")
    
    experiment = collection.fork("docs-experiment")
    print(experiment.count())  # 3
    

Clients

## Chroma clients, tested on VecturaDB

We ran 15 Chroma clients, in 11 languages, with the same test against VecturaDB 1.0.0-preview.5 and against Chroma 1.5.9. In our tests each client gave the same result on the two servers, failures included.

[See the clients](https://vecturadb.org/clients/)

Leaving Chroma Cloud

## Guides for every destination, Chroma included

Chroma Cloud is winding down: it stops accepting writes on 7 December 2026 and stops serving reads on 22 December 2026.

The CLI copies collections from Chroma Cloud into a running VecturaDB:
    
    
    chroma login --api-key <your Chroma Cloud API key>
    chroma copy --from-cloud --to-local --host http://localhost:8000 --db <database> --all
    

[Read the guides](https://vecturadb.org/leaving-chroma-cloud/)

### [To Chroma 1.5.9, single node →The open-source single-node server.](https://vecturadb.org/leaving-chroma-cloud/to-chroma-single-node) ### [To Chroma distributed →The open-source multi-service deployment, run on Kubernetes.](https://vecturadb.org/leaving-chroma-cloud/to-chroma-distributed) ### [To VecturaDB →A single-node server built from Chroma, with Chroma Cloud's sparse vectors, BM25, hybrid search and collection fork.](https://vecturadb.org/leaving-chroma-cloud/to-vecturadb) ### [Hosted embedding models →Shared by the three guides.](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models)

About

## An open-source vector database, compatible with the Chroma API

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Independent project. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility. We use the name "Chroma" only to say which software our projects work with. It does not mean that Chroma Inc. made, approved or supports them.

VecturaDB was forked from the open-source [Chroma](https://github.com/chroma-core/chroma) project. The [VecturaDB repository](https://github.com/VecturaDB/VecturaDB) keeps the full git history of Chroma and its Apache 2.0 license.

The releases are previews, `1.0.0-preview.N`, until VecturaDB has been proven in use; then comes `1.0.0`.

Apache License 2.0. The changes of VecturaDB are copyright of the VecturaDB contributors. Chroma's notices stay as they are: see [LICENSE](https://github.com/VecturaDB/VecturaDB/blob/main/LICENSE) and [NOTICE](https://github.com/VecturaDB/VecturaDB/blob/main/NOTICE).
