Source: https://vecturadb.org/chroma-bm25-without-chroma-cloud/

# Chroma BM25 search on your own server, without Chroma Cloud

**Disclaimer.** This page is provided as is, without warranty of any kind, as stated in the Apache License 2.0. Your data, versions and setup may behave differently. Back up your data and test on a copy first. You are responsible for your data.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Open-source Chroma 1.5.9 refuses BM25 on a single node: `Sparse vector indexing is not enabled in local`. VecturaDB, a single-node server built from Chroma with the same API, runs BM25 indexes and the Search API with the Chroma clients for Python, JavaScript and .NET. Distributed Chroma on Kubernetes runs them too.

VecturaDB is an independent project, not affiliated with Chroma.

## The errors on Chroma 1.5.9

What you do | What Chroma 1.5.9 answers  
---|---  
Create a BM25 or sparse vector index | `Failed to reconcile schema: Invalid schema input: Sparse vector indexing is not enabled in local`  
Search with the Search API | `Error executing plan: Not implemented: Search operation is not implemented for local executor`  
Put a sparse vector in the metadata | `Unimplemented: Sparse vector is not supported for local chroma: <key>`  
  
## 1\. Start VecturaDB
    
    
    docker run -d --name vecturadb -p 127.0.0.1:8000:8000 -v vecturadb-data:/data ghcr.io/vecturadb/vecturadb:1.0.0-preview.9
    

The binary for Windows, Linux and macOS is in the [releases](https://github.com/VecturaDB/VecturaDB/releases). In Python, the `VecturaDB` package also runs without a server.

## 2\. Create a BM25 index and search

The client computes the BM25 vectors from the documents. The dense vectors come from your embedding model: the examples use three short ones.

### Python
    
    
    pip install VecturaDB snowballstemmer
    

The `VecturaDB` package keeps the import name `chromadb`: uninstall `chromadb` first. With a server, `chromadb` 1.5.9 works too. `snowballstemmer` is for BM25.
    
    
    import chromadb
    from chromadb import K, Knn, Schema, Search, SparseVectorIndexConfig
    from chromadb.utils.embedding_functions import ChromaBm25EmbeddingFunction
    
    client = chromadb.HttpClient(host="127.0.0.1", port=8000)
    
    schema = Schema()
    schema.create_index(
        config=SparseVectorIndexConfig(
            source_key=K.DOCUMENT,
            embedding_function=ChromaBm25EmbeddingFunction(),
            bm25=True,
        ),
        key="doc_bm25",
    )
    collection = client.create_collection("articles", schema=schema, embedding_function=None)
    collection.add(
        ids=["fox", "pie", "ml"],
        embeddings=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        documents=[
            "The quick brown fox jumps over the lazy dog",
            "Grandma bakes an apple pie every Sunday",
            "Machine learning is a subset of artificial intelligence",
        ],
    )
    
    results = collection.search(
        Search()
        .rank(Knn(query="apple pie", key="doc_bm25"))
        .limit(3)
        .select(K.DOCUMENT, K.SCORE)
    )
    print(results["ids"], results["scores"])
    

Without a server, `chromadb.PersistentClient(path="./vecturadb-data")` runs the same code inside your application, with the `VecturaDB` package.

### JavaScript
    
    
    npm install chromadb@3.5.0 @chroma-core/chroma-bm25
    
    
    
    import { ChromaClient, K, Knn, Schema, Search, SparseVectorIndexConfig } from "chromadb";
    import { ChromaBm25EmbeddingFunction } from "@chroma-core/chroma-bm25";
    
    const client = new ChromaClient({ host: "127.0.0.1", port: 8000, ssl: false });
    
    const schema = new Schema();
    schema.createIndex(
      new SparseVectorIndexConfig({
        sourceKey: K.DOCUMENT,
        embeddingFunction: new ChromaBm25EmbeddingFunction(),
        bm25: true,
      }),
      "doc_bm25",
    );
    const collection = await client.createCollection({ name: "articles", schema, embeddingFunction: null });
    await collection.add({
      ids: ["fox", "pie", "ml"],
      embeddings: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      documents: [
        "The quick brown fox jumps over the lazy dog",
        "Grandma bakes an apple pie every Sunday",
        "Machine learning is a subset of artificial intelligence",
      ],
    });
    
    const results = await collection.search(
      new Search().rank(Knn({ query: "apple pie", key: "doc_bm25" })).limit(3).select(K.DOCUMENT, K.SCORE),
    );
    console.log(results.ids, results.scores);
    

### .NET

[ChromaDotNet.Client](https://www.nuget.org/packages/ChromaDotNet.Client) 2.20.0:
    
    
    dotnet add package ChromaDotNet.Client
    
    
    
    using ChromaDB.Client;
    using ChromaDB.Client.Models;
    
    using var client = new ChromaClient("http://127.0.0.1:8000");
    
    var collection = await client.CreateCollectionAsync(new ChromaCollectionDefinition("articles")
    {
        Schema = new ChromaCollectionSchema().WithSparseVectorIndex("doc_bm25", ChromaSearchKeys.Document, bm25: true, new ChromaBm25().Reference),
    });
    var articles = client.GetCollectionClient(collection);
    await articles.AddAsync(new ChromaRecords(["fox", "pie", "ml"])
    {
        Embeddings = [new float[] { 1, 0, 0 }, new float[] { 0, 1, 0 }, new float[] { 0, 0, 1 }],
        Documents =
        [
            "The quick brown fox jumps over the lazy dog",
            "Grandma bakes an apple pie every Sunday",
            "Machine learning is a subset of artificial intelligence",
        ],
    });
    
    var results = await articles.SearchAsync(new ChromaSearch
    {
        Rank = ChromaRank.SparseKnn("apple pie", "doc_bm25"),
        Limit = 3,
        Select = [ChromaSearchKeys.Document, ChromaSearchKeys.Score],
    });
    foreach (var result in results)
    {
        Console.WriteLine($"{result.Id} {result.Score}");
    }
    

## 3\. Read the result

With each of the three clients:

Record | Score  
---|---  
`pie` | -4.4985623  
  
The lowest score comes first. Only the records with a term of the query come back: `fox` and `ml` have neither "apple" nor "pie".

## Collections copied from Chroma Cloud

A collection copied with the `vecturadb copy` command keeps its BM25 index. To search it, find the key of the index:
    
    
    collection = client.get_collection("<name>")
    print([key for key, types in collection.schema.keys.items()
           if types.sparse_vector and types.sparse_vector.sparse_vector_index.config.bm25])
    

Then search with `Knn(query="<text>", key="<key>")`. The copy: [Migrate from Chroma Cloud](https://vecturadb.org/migrate-from-chroma-cloud/).

## Hybrid search

To merge BM25 with dense search, see [Hybrid search on your own server](https://vecturadb.org/leaving-chroma-cloud/hybrid-search-without-chroma-cloud).

## On Kubernetes

Distributed Chroma runs BM25 too: see [Migrate from Chroma Cloud to self-hosted distributed Chroma on Kubernetes](https://chromadotnet.org/migrate-from-chroma-cloud-kubernetes/).
