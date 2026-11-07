Source: https://vecturadb.org/clients/

# Chroma clients, tested on VecturaDB

In our tests, Chroma clients work with VecturaDB as they do with Chroma 1.5.9: we ran 15 of them, in 11 languages, and in the steps that Chroma 1.5.9 has, each gave the same result on both servers, step by step.

## Results by client

  * Works**Works** : all 9 steps gave the expected result.
  * Partial**Partial** : the steps the client has passed; the others are not in the client.
  * Fails**Fails** : at least one step gave an error.

Client| Chroma1.5.9| VecturaDB1.0.0-preview.8| Details  
---|---|---|---  
Python `chromadb-client` 1.5.9| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#python-chromadb-client)  
JavaScript `chromadb` 3.5.0| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#javascript-chromadb)  
.NET `ChromaDotNet.Client` 2.20.0| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#dotnet-chromadotnet-client)  
.NET `CommunityToolkit.VectorData.Chroma` 1.0.2-preview| PartialPartial| PartialPartial| [Details →](https://vecturadb.org/clients/details/#dotnet-communitytoolkit-vectordata-chroma)  
.NET `Microsoft.SemanticKernel.Connectors.Chroma` 1.74.0-alpha| FailsFails| FailsFails| [Details →](https://vecturadb.org/clients/details/#dotnet-semantic-kernel-connector)  
Go `github.com/amikos-tech/chroma-go` v0.4.1| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#go-chroma-go)  
PHP `codewithkyrian/chromadb-php` 1.0.0| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#php-codewithkyrian-chromadb-php)  
PHP `helgesverre/chromadb` v3.0.0| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#php-helgesverre-chromadb)  
Dart `chromadb` 2.0.0| WorksWorks| WorksWorks| [Details →](https://vecturadb.org/clients/details/#dart-chromadb)  
Rust `chroma` 0.15.0| PartialPartial| PartialPartial| [Details →](https://vecturadb.org/clients/details/#rust-chroma)  
Rust `chromadb` 2.3.0| FailsFails| FailsFails| [Details →](https://vecturadb.org/clients/details/#rust-chromadb)  
Elixir `chroma` 0.1.3| PartialPartial| PartialPartial| [Details →](https://vecturadb.org/clients/details/#elixir-chroma)  
Ruby `chroma-db` 0.9.0| FailsFails| FailsFails| [Details →](https://vecturadb.org/clients/details/#ruby-chroma-db)  
Java `io.github.amikos-tech:chromadb-java-client` 0.1.7| FailsFails| FailsFails| [Details →](https://vecturadb.org/clients/details/#java-chromadb-java-client)  
Clojure `levand/clojure-chroma-client`, commit 61766c3| FailsFails| FailsFails| [Details →](https://vecturadb.org/clients/details/#clojure-clojure-chroma-client)  
  
Each failure on this page happened in the same way on Chroma 1.5.9. Four of the five failing clients call the v1 API, which Chroma 1.x no longer serves.

In the [details](https://vecturadb.org/clients/details/): the steps of each client, with its errors and notes; [how we tested](https://vecturadb.org/clients/details/#how-we-tested); and [sparse vectors, BM25, the Search API and API keys](https://vecturadb.org/clients/details/#sparse-vectors-bm25-search-and-api-keys), tested with the two Rust crates.

## Features of distributed Chroma

Nine of the clients have calls for features of distributed Chroma, the one Chroma Cloud runs on: fork, read levels, attached functions and CRN. They are `chromadb-client` 1.5.9 for Python, `chromadb` 3.5.0 for JavaScript, `ChromaDotNet.Client` 2.20.0 for .NET, `github.com/amikos-tech/chroma-go` v0.4.1 for Go, `codewithkyrian/chromadb-php` 1.0.0 for PHP, `helgesverre/chromadb` v3.0.0 for PHP, `chromadb` 2.0.0 for Dart, `chroma` 0.15.0 for Rust and `chroma-db` 0.9.0 for Ruby. On VecturaDB, 71 of their steps passed, none failed, 36 are not in the client and 1 answered 200 without reading the name back. On Chroma 1.5.9, 21 passed, 34 failed, 36 are not in the client, 16 did not run after an error and 1 answered 200 without reading the name back.

The steps of each client: [Features of distributed Chroma](https://vecturadb.org/clients/details/#features-of-distributed-chroma), in the details.

**Disclaimer.** These results are provided as is, without warranty of any kind, as stated in the Apache License 2.0. They describe what we measured on 7 November 2026: your client, its version and your setup may behave differently.

Not sure about your client? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), name the client and its version, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
