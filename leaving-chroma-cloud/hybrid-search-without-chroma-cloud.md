Source: https://vecturadb.org/leaving-chroma-cloud/hybrid-search-without-chroma-cloud

[Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/)

# Hybrid search on your own server, without Chroma Cloud

**Disclaimer.** This guide is provided as is, without warranty of any kind, as stated in the Apache License 2.0. It describes what we measured on 4 and 5 November 2026: your data, versions and setup may behave differently. Back up your data and test on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma 1.5.9 on a single node has no hybrid search. VecturaDB does: it is a single-node server built from Chroma, and it merges dense search and BM25 search with the Search API. It runs as one container, as a binary, or inside a Python application, with your Chroma clients.

VecturaDB is an independent project, not affiliated with Chroma. We ran every command and every line of code below on 5 November 2026, against VecturaDB 1.0.0-preview.6. Chroma distributed has hybrid search too, on Kubernetes: see the [overview](https://vecturadb.org/leaving-chroma-cloud/).

## The errors on Chroma 1.5.9

What you do | What Chroma 1.5.9 answers  
---|---  
Create a BM25 index | `Failed to reconcile schema: Invalid schema input: Sparse vector indexing is not enabled in local`  
Call the Search API on a server | `Error executing plan: Not implemented: Search operation is not implemented for local executor`  
Call the Search API inside Python | `Search is not implemented for Local Chroma`  
  
## 1\. Start VecturaDB
    
    
    docker run -d --name vecturadb -p 127.0.0.1:8000:8000 -v ./vecturadb-data:/data ghcr.io/vecturadb/vecturadb:1.0.0-preview.6
    

To run it without Docker, see [Start the server](https://vecturadb.org/migrate-from-chroma-cloud/#1-start-the-server).

## 2\. Create the index and search

The dense vectors come from your embedding model: the examples use three short ones. The client computes the BM25 vectors from the documents.

### Python
    
    
    pip install VecturaDB snowballstemmer
    

The `VecturaDB` package keeps the import name `chromadb`. `chromadb` 1.5.9 gave the same results against the server.
    
    
    import chromadb
    from chromadb import K, Knn, Rrf, Schema, Search, SparseVectorIndexConfig
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
    collection = client.create_collection("docs", schema=schema, embedding_function=None)
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
    
    hybrid = Rrf(
        ranks=[
            Knn(query=[0, 1, 0], return_rank=True, default=1000),
            Knn(query="apple pie", key="doc_bm25", return_rank=True, default=1000),
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
    print(results["ids"], results["scores"])
    

Without a server, `chromadb.PersistentClient(path="./vecturadb-data")` gave the same results, inside the Python application.

### JavaScript
    
    
    npm install chromadb@3.5.0 @chroma-core/chroma-bm25
    
    
    
    import { ChromaClient, K, Knn, Rrf, Schema, Search, SparseVectorIndexConfig } from "chromadb";
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
    const collection = await client.createCollection({ name: "docs", schema, embeddingFunction: null });
    await collection.add({
      ids: ["fox", "pie", "ml"],
      embeddings: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      documents: [
        "The quick brown fox jumps over the lazy dog",
        "Grandma bakes an apple pie every Sunday",
        "Machine learning is a subset of artificial intelligence",
      ],
      metadatas: [{ topic: "animals" }, { topic: "food" }, { topic: "tech" }],
    });
    
    const hybrid = Rrf({
      ranks: [
        Knn({ query: [0, 1, 0], returnRank: true, default: 1000 }),
        Knn({ query: "apple pie", key: "doc_bm25", returnRank: true, default: 1000 }),
      ],
      weights: [0.7, 0.3],
      k: 60,
    });
    const results = await collection.search(
      new Search().where(K("topic").ne("tech")).rank(hybrid).limit(2).select(K.DOCUMENT, K.SCORE),
    );
    console.log(results.ids, results.scores);
    

### .NET
    
    
    dotnet add package ChromaDotNet.Client
    
    
    
    using ChromaDB.Client;
    using ChromaDB.Client.Models;
    
    using var client = new ChromaClient("http://127.0.0.1:8000");
    
    var collection = await client.CreateCollectionAsync(new ChromaCollectionDefinition("docs")
    {
        Schema = new ChromaCollectionSchema().WithSparseVectorIndex("doc_bm25", ChromaSearchKeys.Document, bm25: true, new ChromaBm25().Reference),
    });
    var collectionClient = client.GetCollectionClient(collection);
    await collectionClient.AddAsync(new ChromaRecords(["fox", "pie", "ml"])
    {
        Embeddings = [new float[] { 1, 0, 0 }, new float[] { 0, 1, 0 }, new float[] { 0, 0, 1 }],
        Documents =
        [
            "The quick brown fox jumps over the lazy dog",
            "Grandma bakes an apple pie every Sunday",
            "Machine learning is a subset of artificial intelligence",
        ],
        Metadatas =
        [
            new Dictionary<string, object> { ["topic"] = "animals" },
            new Dictionary<string, object> { ["topic"] = "food" },
            new Dictionary<string, object> { ["topic"] = "tech" },
        ],
    });
    
    var results = await collectionClient.SearchAsync(new ChromaSearch
    {
        Where = ChromaWhereOperator.NotEqual("topic", "tech"),
        Rank = ChromaRank.Rrf(
            [
                ChromaRank.Knn(new float[] { 0, 1, 0 }, defaultScore: 1000, returnRank: true),
                ChromaRank.SparseKnn("apple pie", "doc_bm25", defaultScore: 1000, returnRank: true),
            ],
            k: 60,
            weights: [0.7, 0.3]),
        Limit = 2,
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
`pie` | -0.016666668  
`fox` | -0.011758428  
  
The lowest score comes first. `ml` is out because of the filter on `topic`.

## Keep `default` in the two rankings

  * With `default`, a record that only one ranking finds stays in the results. `default` is its position in the other ranking.
  * Without `default`, the search keeps only the records that both rankings find. The same search gave `pie` alone.

## Compare with Chroma Cloud once it has indexed

Compare searches when `indexing_status` on Chroma Cloud shows `num_unindexed_ops` 0\. In our tests, VecturaDB answered from the first second as Chroma Cloud answers once indexed.

Before indexing, Chroma Cloud answers differently:

  * It also returns records without any term of the query, with score 1, up to the limit of the search. VecturaDB returns only the records with a term.
  * Until the first indexing of a collection, BM25 scores are higher. The first result of one of our searches scored -19.58, and -1.89 once indexed.
  * Indexing took about a minute from 250 records, and 31 to 35 minutes with 3 to 240 records, in the 5 collections we followed.

The example of this page, on Chroma Cloud with the Python client, was indexed after 32 minutes. It then gave `pie` -0.016666668 and `fox` -0.011758428, as on VecturaDB. Right after the writes it gave `fox` -0.016393442.

In our tests on 4 November 2026, on VecturaDB 1.0.0-preview.5, we compared 698 searches with the Python client `chromadb` 1.5.9, 349 on HNSW and 349 on SPANN, on three sets of generated documents from 200 to 12,300 records, also after updates and deletions. Searches with `read_level` `index_only` are not among them. Every search gave the same records in the same order, with scores within 0.00001.

Answers can still differ, because dense search is approximate. With HNSW, on 2,000 vectors in 10 groups loaded 12 times, a query between two groups found 4 to 10 of its 10 true neighbours. Chroma 1.5.9 did the same. `Rrf` without `default` then gave 0 to 8 records where Chroma Cloud gave 3. With `ef_search` 500, the same query found all 10 on each of the 12 loads.

We did not test:

  * other clients in this comparison: the client computes the BM25 vectors, and its stemmer can change them;
  * a restart of the server before reading, or writes running during the searches;
  * document filters together with a sparse search;
  * long documents, or documents not in English.

## Your data on Chroma Cloud

Chroma Cloud stops accepting writes on 7 December 2026, and stops serving reads on 22 December 2026. To move your collections, follow [Migrate from Chroma Cloud to a self-hosted Chroma server](https://vecturadb.org/migrate-from-chroma-cloud/).
