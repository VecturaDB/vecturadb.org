Source: https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models

[Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/)

# Leaving Chroma Cloud: hosted embedding models

**Disclaimer.** These guides and the scripts they link are provided as is, without warranty of any kind, as stated in the Apache License 2.0. They describe what we measured on 25 October 2026: your data, versions and setup may behave differently. Back up your data and test the migration on a copy first. You are responsible for your data and for every migration you run.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

Chroma Cloud runs two embedding models for its clients:

Embedding function | Model | Kind  
---|---|---  
`chroma-cloud-qwen` | `Qwen/Qwen3-Embedding-0.6B` | dense, 1024 dimensions  
`chroma-cloud-splade` | `prithivida/Splade_PP_en_v1` | sparse  
  
Both run on Chroma Cloud's servers, and they stop when Chroma Cloud stops. Both models are open: you can run them yourself. This page says what we measured, and how to switch a collection to the local models. It is the same for the three destinations.

VecturaDB, which wrote this guide, is not affiliated with Chroma. We measured on 25 October 2026, with the Python client `chromadb` 1.5.9.

## Same vectors?

We embedded 12 documents and 4 queries on Chroma Cloud and locally, and compared.

| Local replacement | Vectors (cosine, Chroma Cloud vs local) | Search results  
---|---|---|---  
`chroma-cloud-qwen` | the same model with `sentence-transformers`, in float32 | ≥ 0.999997 | the same top 3 and the same order, 4 of 4 queries  
`chroma-cloud-splade` | the same model with `fastembed` | ≥ 0.99997 | the same top 3, 4 of 4 queries  
  
The search results were the same both when only the queries were embedded locally, against the documents embedded on Chroma Cloud, and when everything was embedded locally. So in our tests the embeddings you already have do not need to be recomputed.

Two things matter:

  * **float32.** `sentence-transformers` loaded Qwen in bfloat16 on our CPU. In bfloat16 the cosine was 0.9998: close, but not the same. Ask for float32, as in the code below.
  * **Our test set is small.** Before you rely on it, compare the results of a few of your own queries on Chroma Cloud and on your destination, while Chroma Cloud still answers.

## Qwen, without a task

This is the common case: `ChromaCloudQwenEmbeddingFunction(model=..., task=None)`.
    
    
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    
    qwen = SentenceTransformerEmbeddingFunction(
        model_name="Qwen/Qwen3-Embedding-0.6B",
        normalize_embeddings=True,
        model_kwargs={"dtype": "float32"},
    )
    

It needs `pip install sentence-transformers`.

A collection created on Chroma Cloud with `task=None` stores no usable embedding function: its configuration says `legacy`. Opened without a function, it gets Chroma's default model, which has 384 dimensions, and a text query fails with `Collection expecting embedding with dimension of 1024, got 384`. Pass the function each time you open the collection, or store it once:
    
    
    collection = client.get_collection("<name>", embedding_function=None)
    collection.modify(configuration={"embedding_function": qwen})
    

After that, `client.get_collection("<name>")` loads the local Qwen from the configuration.

## Qwen, with a task

With a task, for example `task="nl_to_code"`, Chroma Cloud adds an instruction to the queries. The plain local function does not: its query vectors had a cosine of 0.75 with Chroma Cloud's. Add the instruction in Qwen's format:
    
    
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    
    
    class QwenWithInstruction(SentenceTransformerEmbeddingFunction):
        def __init__(self, instruction):
            super().__init__(model_name="Qwen/Qwen3-Embedding-0.6B", normalize_embeddings=True,
                             model_kwargs={"dtype": "float32"})
            self.instruction = instruction
    
        def embed_query(self, input):
            return super().__call__([f"Instruct: {self.instruction}\nQuery:{q}" for q in input])
    
    
    qwen = QwenWithInstruction("Given a question about coding, retrieval code or passage that can solve user's question")
    

The instruction above is the one of `nl_to_code` in the Python client. With it, the 4 queries gave Chroma Cloud's ranking.

A collection created with a task stores `chroma-cloud-qwen` in its configuration, and switching it needs one particular call:

  * `client.get_collection(name, embedding_function=qwen)` fails: `An embedding function already exists in the collection configuration, and a new one is provided`;
  * `client.get_collection(name).modify(...)` fails: `Cannot update embedding function: incompatible types`;
  * this works:

    
    
    collection = client.get_collection("<name>", embedding_function=None)
    collection.modify(configuration={"embedding_function": qwen})
    

The stored configuration keeps the model, not the instruction. For queries, pass `QwenWithInstruction` when you open the collection.

## SPLADE
    
    
    from chromadb.utils.embedding_functions import FastembedSparseEmbeddingFunction
    
    splade = FastembedSparseEmbeddingFunction(model_name="prithivida/Splade_PP_en_v1")
    

It needs `pip install fastembed`. Only a destination with sparse vectors can use it: VecturaDB or Chroma distributed.

The copied schema keeps `chroma-cloud-splade` as the function of the sparse key. Without Chroma Cloud, compute the sparse vectors yourself and pass them; this worked with Chroma Cloud unreachable:
    
    
    from chromadb import Knn, Search
    from chromadb.base_types import SparseVector
    
    # Search: embed the query locally
    q = splade.embed_query(["what is the capital of France"])[0]
    results = collection.search(Search().rank(Knn(query=SparseVector(indices=q.indices, values=q.values), key="<sparse key>")).limit(10))
    
    # Add: put the sparse vector in the metadata, and the client does not call Chroma Cloud
    v = splade(["Rome is the capital of Italy"])[0]
    collection.add(ids=["new1"], documents=["Rome is the capital of Italy"], embeddings=[dense_vector],
                   metadatas=[{"<sparse key>": SparseVector(indices=v.indices, values=v.values)}])
