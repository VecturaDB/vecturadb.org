Source: https://vecturadb.org/clients/details/

[Clients](https://vecturadb.org/clients/) / Details

# Chroma clients, step by step

Each Chroma client we ran against VecturaDB and against Chroma 1.5.9: the result of each step on the two servers, the notes and the defects of the client. The summary, one row for each client, is on the [Clients](https://vecturadb.org/clients/) page.

**Disclaimer.** These results are provided as is, without warranty of any kind, as stated in the Apache License 2.0. They describe what we measured on 13 November 2026: your client, its version and your setup may behave differently.

Not sure about your client? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), name the client and its version, and we will take a look on a best-effort basis.

On this page

  1. What the results mean
  2. Python
  3. JavaScript
  4. .NET
  5. Go
  6. PHP
  7. Dart
  8. Rust
  9. Elixir
  10. Ruby
  11. Java
  12. Clojure
  13. Sparse vectors, BM25, Search and API keys
  14. SPANN
  15. Features of distributed Chroma
  16. How we tested
  17. Moving from Chroma Cloud

## What the results mean

  * **Works** : all 9 steps gave the expected result.
  * **Partial** : the steps the client has passed; the others are not in the client.
  * **Fails** : at least one step gave an error. Each failure on this page happened in the same way on Chroma 1.5.9. Four of the five failing clients call the v1 API, which Chroma 1.x no longer serves.

## Python

### `chromadb-client` 1.5.9

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed, with the server block  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Error: Count forks is unsupported for local chroma| Passed: 1  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Passed: HNSW| Passed: SPANN  
29\. Search at index_and_wal, then at index_only| Error: Search operation is not implemented for local executor| Passed: index_and_wal finds r1, r3; index_only finds no record  
Attached functions  
30\. Attach record_counter| Error: Attached Function operations not yet implemented in SqliteSysDb| Passed  
31\. Read the attached function| Not run: no function| Passed: record_counter  
32\. Its output after 3 records| Not run: no function| Passed: total_count 3  
33\. Detach it, with its output| Not run: no function| Passed  
CRN  
34\. Give the tenant a resource name| Not in the client| Not in the client  
35\. Get the collection by its CRN| Not in the client| Not in the client  
  
  * How we tested them: Features of distributed Chroma.

## JavaScript

### `chromadb` 3.5.0

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed, with the server block  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Error: Count forks is unsupported for local chroma| Passed: 1  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Passed: HNSW| Passed: SPANN  
29\. Search at index_and_wal, then at index_only| Error: Search operation is not implemented for local executor| Passed: index_and_wal finds r1, r3; index_only finds no record  
Attached functions  
30\. Attach record_counter| Not in the client| Not in the client  
31\. Read the attached function| Not in the client| Not in the client  
32\. Its output after 3 records| Not in the client| Not in the client  
33\. Detach it, with its output| Not in the client| Not in the client  
CRN  
34\. Give the tenant a resource name| Failed: answered 200, but the name reads back null| Passed: the name reads back  
35\. Get the collection by its CRN| Error: the server closed the connection| Passed: the same collection  
  
  * How we tested them: Features of distributed Chroma.

## .NET

### `ChromaDotNet.Client` 2.20.0

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
  * The whole test suite of the client at commit a6ac581 of its main branch, on VecturaDB 1.0.0-preview.5: 2252 passed, 12 skipped, 0 failed. The skipped tests are for Chroma Cloud quotas and settings, tenants and databases created on a server already running, the built-in authentication that Chroma 1.0 removed, timing measurements and Chroma 0.x.

#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Error: Count forks is unsupported for local chroma| Passed: 1  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Error: an HNSW index, which ignores the SPANN settings: the client deleted the collection| Passed: SPANN  
29\. Search at index_and_wal, then at index_only| Not run: no collection| Passed: index_and_wal finds r1, r3; index_only finds no record  
Attached functions  
30\. Attach record_counter| Error: Attached Function operations not yet implemented in SqliteSysDb| Passed  
31\. Read the attached function| Not run: no function| Passed: record_counter  
32\. Its output after 3 records| Not run: no function| Passed: total_count 3  
33\. Detach it, with its output| Not run: no function| Passed  
CRN  
34\. Give the tenant a resource name| Answered 200, not read back| Answered 200, not read back  
35\. Get the collection by its CRN| Error: the server closed the connection| Passed: the same collection  
  
  * How we tested them: Features of distributed Chroma.

### `CommunityToolkit.VectorData.Chroma` 1.1.0-preview

Partial on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Not in the client| Not in the client  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Delete only: a get of the 3 ids finds 2. Count is not in the client| Delete only: a get of the 3 ids finds 2. Count is not in the client  
9\. Delete the collection| Passed| Passed  
  
  * The Chroma provider of the AI Community Toolkit. It has no heartbeat, pre-flight-checks or count, and it adds records with upsert; the other steps passed. The document of a record is its full-text property.

### `Microsoft.SemanticKernel.Connectors.Chroma` 1.74.0-alpha

Fails, also on Chroma 1.5.9.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Not in the client| Not in the client  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Error: 405 Method Not Allowed| Error: 405 Method Not Allowed  
4\. Add 3 records| Not run: no collection| Not run: no collection  
5\. Query [1, 0], 2 results| Not run: no collection| Not run: no collection  
6\. Get by id| Not run: no collection| Not run: no collection  
7\. Get with a filter| Not run: no collection| Not run: no collection  
8\. Delete one record, then count| Not run: no collection| Not run: no collection  
9\. Delete the collection| Not run: no collection| Not run: no collection  
  
  * The v1 API only: creating a collection answers "405 (Method Not Allowed)".
  * Deprecated on NuGet, which suggests `CommunityToolkit.VectorData.Chroma`.

## Go

### `github.com/amikos-tech/chroma-go` v0.4.1

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
  * To install it, its dependency `chroma-go-local` v0.3.4 had to be replaced with v0.3.5: proxy.golang.org answered 404 and the direct download failed the checksum. Only the embedded client uses it.

#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Error: Count forks is unsupported for local chroma| Passed: 1  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Passed: HNSW| Passed: SPANN  
29\. Search at index_and_wal, then at index_only| Error: Search operation is not implemented for local executor| Passed: index_and_wal finds r1, r3; index_only finds no record  
Attached functions  
30\. Attach record_counter| Not in the client| Not in the client  
31\. Read the attached function| Not in the client| Not in the client  
32\. Its output after 3 records| Not in the client| Not in the client  
33\. Detach it, with its output| Not in the client| Not in the client  
CRN  
34\. Give the tenant a resource name| Not in the client| Not in the client  
35\. Get the collection by its CRN| Not in the client| Not in the client  
  
  * How we tested them: Features of distributed Chroma.

## PHP

### `codewithkyrian/chromadb-php` 1.0.0

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed, with the server block  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Not in the client| Not in the client  
25\. Fork it, count the fork| Not in the client| Not in the client  
26\. Fork count| Not in the client| Not in the client  
27\. Delete the fork, if any, and the collection| Not in the client| Not in the client  
Read levels  
28\. Create a collection, add 3 records| Not in the client| Not in the client  
29\. Search at index_and_wal, then at index_only| Not in the client| Not in the client  
Attached functions  
30\. Attach record_counter| Not in the client| Not in the client  
31\. Read the attached function| Not in the client| Not in the client  
32\. Its output after 3 records| Not in the client| Not in the client  
33\. Detach it, with its output| Not in the client| Not in the client  
CRN  
34\. Give the tenant a resource name| Failed: answered 200, but the name reads back null| Passed: the name reads back  
35\. Get the collection by its CRN| Error: the server closed the connection| Passed: the same collection  
  
  * How we tested them: Features of distributed Chroma.

### `helgesverre/chromadb` v3.0.0

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed, with the server block  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Not in the client| Not in the client  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Not in the client| Not in the client  
29\. Search at index_and_wal, then at index_only| Not in the client| Not in the client  
Attached functions  
30\. Attach record_counter| Error: Attached Function operations not yet implemented in SqliteSysDb| Passed  
31\. Read the attached function| Not run: no function| Passed: record_counter  
32\. Its output after 3 records| Not run: no function| Passed: total_count 3  
33\. Detach it, with its output| Not run: no function| Passed  
CRN  
34\. Give the tenant a resource name| Failed: answered 200, but the name reads back null| Passed: the name reads back  
35\. Get the collection by its CRN| Error: the server closed the connection| Passed: the same collection  
  
  * How we tested them: Features of distributed Chroma.

## Dart

### `chromadb` 2.0.0

Works on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed, with the server block  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Error: Count forks is unsupported for local chroma| Passed: 1  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Passed: HNSW, as the client sends no configuration| Passed: HNSW, as the client sends no configuration  
29\. Search at index_and_wal, then at index_only| Error: Search operation is not implemented for local executor| Passed: index_and_wal counts 3 and finds r1, r3; index_only counts 3 and finds r1, r3  
Attached functions  
30\. Attach record_counter| Error: Attached Function operations not yet implemented in SqliteSysDb| Passed  
31\. Read the attached function| Not run: no function| Passed: record_counter  
32\. Its output after 3 records| Not run: no function| Passed: total_count 3  
33\. Detach it, with its output| Not run: no function| Passed  
CRN  
34\. Give the tenant a resource name| Failed: answered 200, but the name reads back null| Passed: the name reads back  
35\. Get the collection by its CRN| Error: the server closed the connection| Passed: the same collection  
  
  * How we tested them: Features of distributed Chroma.

## Rust

### `chroma` 0.15.0

Partial on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
  * The crate has no pre-flight-checks; the other 8 steps passed. It needs `protoc` to build.

#### VecturaDB features

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Create a collection with a sparse vector index| Error: 400 Sparse vector indexing is not enabled in local| Passed  
Add 3 records with BM25 vectors| Not run: no collection| Passed  
Search, dense: [1, 0]| Not run: no collection| Passed: r1, r3  
Search, BM25: "apple"| Not run: no collection| Passed: r1  
Delete the collection| Not run: no collection| Passed  
With one API key on both servers  
No API key| Accepted| Rejected: 401 Permission denied.  
The right API key| Accepted| Accepted  
A wrong API key| Accepted| Rejected: 401 Permission denied.  
  
  * It sent the API key with `ChromaAuthMethod::cloud_api_key`.
  * How we tested them: Sparse vectors, BM25, Search and API keys.

#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: Collection forking is unsupported for local chroma| Passed: the fork has 3 records  
26\. Fork count| Error: Count forks is unsupported for local chroma| Passed: 1  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Passed| Passed  
29\. Search at index_and_wal, then at index_only| Error: Search operation is not implemented for local executor| Passed: index_and_wal counts 3 and finds r1, r3; index_only counts 0 and finds no record  
Attached functions  
30\. Attach record_counter| Error: Attached Function operations not yet implemented in SqliteSysDb| Passed  
31\. Read the attached function| Not run: no function| Passed: record_counter  
32\. Its output after 3 records| Not run: no function| Passed: total_count 3  
33\. Detach it, with its output| Not run: no function| Passed  
CRN  
34\. Give the tenant a resource name| Not in the client| Not in the client  
35\. Get the collection by its CRN| Not in the client| Not in the client  
  
  * How we tested them: Features of distributed Chroma.

### `chromadb` 2.3.0

Fails, also on Chroma 1.5.9.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Error: 410 Gone| Error: 410 Gone  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Passed| Passed  
7\. Get with a filter| Passed| Passed  
8\. Delete one record, then count| Passed| Passed  
9\. Delete the collection| Passed| Passed  
  
  * The heartbeat calls the v1 API: "410 Gone: The v1 API is deprecated. Please use /v2 apis". The other steps passed.

#### VecturaDB features

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
With one API key on both servers  
No API key| Accepted| Rejected: 401 Permission denied.  
The right API key| Accepted| Accepted  
A wrong API key| Accepted| Rejected: 401 Permission denied.  
  
  * It sent the API key with `TokenAuth`, in the `X-Chroma-Token` header.
  * How we tested them: Sparse vectors, BM25, Search and API keys.

## Elixir

### `chroma` 0.1.3

Partial on both servers.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Not in the client| Not in the client  
7\. Get with a filter| Not in the client| Not in the client  
8\. Delete one record, then count| Count only: 3. Delete is not in the client| Count only: 3. Delete is not in the client  
9\. Delete the collection| Passed| Passed  
  
  * Set to the v2 API with its `api_version` setting. The library has no pre-flight-checks, get by id, where or delete of records; the other steps passed.

## Ruby

### `chroma-db` 0.9.0

Fails, also on Chroma 1.5.9.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Passed| Passed  
2\. Pre-flight-checks| Passed| Passed, with the server block  
3\. Create a collection, cosine| Passed| Passed  
4\. Add 3 records| Passed| Passed  
5\. Query [1, 0], 2 results| Passed| Passed  
6\. Get by id| Error: NoMethodError| Error: NoMethodError  
7\. Get with a filter| Error: NoMethodError| Error: NoMethodError  
8\. Delete one record, then count| Error: NoMethodError| Error: NoMethodError  
9\. Delete the collection| Passed| Passed  
  
  * Get and delete send an empty `where` and `where_document`, which both servers reject with 400 "Invalid where clause". The gem then raises `NoMethodError: private method `raise_failure_error'` instead of the message of the server.

#### Features of distributed Chroma

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
Fork  
24\. Create a collection, add 3 records| Passed| Passed  
25\. Fork it, count the fork| Error: NoMethodError| Passed: the fork has 3 records  
26\. Fork count| Not in the client| Not in the client  
27\. Delete the fork, if any, and the collection| Passed| Passed  
Read levels  
28\. Create a collection, add 3 records| Not in the client| Not in the client  
29\. Search at index_and_wal, then at index_only| Not in the client| Not in the client  
Attached functions  
30\. Attach record_counter| Not in the client| Not in the client  
31\. Read the attached function| Not in the client| Not in the client  
32\. Its output after 3 records| Not in the client| Not in the client  
33\. Detach it, with its output| Not in the client| Not in the client  
CRN  
34\. Give the tenant a resource name| Not in the client| Not in the client  
35\. Get the collection by its CRN| Not in the client| Not in the client  
  
  * How we tested them: Features of distributed Chroma.

## Java

### `io.github.amikos-tech:chromadb-java-client` 0.1.7

Fails, also on Chroma 1.5.9.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Error: Gone| Error: Gone  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Error: Method Not Allowed| Error: Method Not Allowed  
4\. Add 3 records| Not run: no collection| Not run: no collection  
5\. Query [1, 0], 2 results| Not run: no collection| Not run: no collection  
6\. Get by id| Not run: no collection| Not run: no collection  
7\. Get with a filter| Not run: no collection| Not run: no collection  
8\. Delete one record, then count| Not run: no collection| Not run: no collection  
9\. Delete the collection| Not run: no collection| Not run: no collection  
  
  * The v1 API only: the heartbeat answers "Gone", creating a collection "Method Not Allowed".

## Clojure

### `levand/clojure-chroma-client`, commit 61766c3

Fails, also on Chroma 1.5.9.

Step| Chroma1.5.9| VecturaDB1.0.0-preview.9  
---|---|---  
1\. Heartbeat| Error: Unsuccessful HTTP status code| Error: Unsuccessful HTTP status code  
2\. Pre-flight-checks| Not in the client| Not in the client  
3\. Create a collection, cosine| Error: Unsuccessful HTTP status code| Error: Unsuccessful HTTP status code  
4\. Add 3 records| Not run: no collection| Not run: no collection  
5\. Query [1, 0], 2 results| Not run: no collection| Not run: no collection  
6\. Get by id| Not run: no collection| Not run: no collection  
7\. Get with a filter| Not run: no collection| Not run: no collection  
8\. Delete one record, then count| Not run: no collection| Not run: no collection  
9\. Delete the collection| Not run: no collection| Not run: no collection  
  
  * The v1 API only: "Unsuccessful HTTP status code" from the heartbeat and from creating a collection.

## Sparse vectors, BM25, Search and API keys

VecturaDB also has sparse vectors, BM25, the Search API and API keys on the single node, where Chroma 1.5.9 does not have them. We tested them with the two Rust crates, against VecturaDB 1.0.0-preview.9 and against Chroma 1.5.9:

  * **Sparse vectors, BM25 and Search** , with `chroma` 0.15.0. On VecturaDB the crate created a collection with a sparse vector index, added 3 records with the BM25 vectors it computes from their documents, and searched them with the Search API: the dense search for [1, 0] gave r1 then r3, and the BM25 search for "apple" gave r1. Chroma 1.5.9 rejected the index with 400 "Sparse vector indexing is not enabled in local".
  * **API keys** , with both crates. We started both servers with one API key in `CHROMA_SERVER_AUTHN_CREDENTIALS`. VecturaDB answered 401 "Permission denied." without a key and with a wrong key, and accepted the right one: `chroma` 0.15.0 sent it with `ChromaAuthMethod::cloud_api_key`, `chromadb` 2.3.0 with `TokenAuth` in the `X-Chroma-Token` header. With the right key, the other steps gave the same results as without keys. Chroma 1.5.9 has no built-in authentication: it accepted every request, with any key or none. To set up API keys, see [API keys](https://github.com/VecturaDB/VecturaDB/blob/v1.0.0-preview.9/docs/mintlify/guides/deploy/client-server-mode.mdx#api-keys).

## SPANN

On VecturaDB 1.0.0-preview.9, a collection that asks for SPANN gets a SPANN index on the single node. We tested it with four clients: `chromadb-client` 1.5.9 for Python, `chromadb` 3.5.0 for JavaScript, `chroma` 0.15.0 for Rust and `ChromaDotNet.Client` 2.20.0. Each client created a collection with SPANN in its configuration, added 3 records and queried [1, 0], 2 results. On VecturaDB the collection reported a SPANN index, and the query gave r1 then r3 with all four clients. Chroma 1.5.9 created an HNSW index instead, as a single Chroma server ignores the SPANN settings: the clients for Python, JavaScript and Rust went on with it, and `ChromaDotNet.Client` refused the collection and deleted it.

## Features of distributed Chroma

Nine of the clients have calls for features of distributed Chroma, the one Chroma Cloud runs on, that Chroma 1.5.9 does not have on a single node. Each of them ran the same steps 24 to 35 against VecturaDB 1.0.0-preview.9 and against Chroma 1.5.9:

  * **Fork** : a collection of 3 records, its fork and the count of the fork, the fork count, then both collections deleted.
  * **Read levels** : a collection of 3 records, with SPANN in its configuration where the client can ask for it, then a search at `index_and_wal` and one at `index_only`.
  * **Attached functions** : `record_counter` attached to a new collection, read back, its output after 3 records, then detached with its output collection.
  * **CRN** : a resource name for the default tenant, then the collection read by its CRN.

A step that is not in the client is marked so; a step after a failed one does not run.

## How we tested

  * The servers: `chromadb/chroma:1.5.9` and `ghcr.io/vecturadb/vecturadb:1.0.0-preview.9`, for linux/amd64, with the default command of the image. The image of VecturaDB was `sha256:a934edb1bc8f431fd0c3bc2dfcf89d001f87f9086ee7b0cca22a3528b022768c`.
  * A new container for each client and each server, with an empty data folder, on a Docker network: the client reached the server at port 8000. No API keys outside the API key steps, the default tenant and database.
  * Each client ran in a container of its language, with its version pinned.

The steps were the same for every client, with embeddings of two numbers given by hand, so no embedding model was involved:

  1. heartbeat;
  2. pre-flight-checks;
  3. create a collection, with the cosine space;
  4. add 3 records with documents and metadata;
  5. query with [1, 0] for 2 results, expecting r1 then r3;
  6. get by id;
  7. get with the filter `{"n": {"$gte": 2}}`;
  8. delete one record, then count, expecting 2;
  9. delete the collection.

The one difference between the two servers is in step 2: VecturaDB adds its `server` block to the answer of pre-flight-checks. The clients that show the raw answer, Python, JavaScript, Dart, Ruby and both PHP clients, took it without errors, with the same `max_batch_size`, 5461.

## Moving from Chroma Cloud

The guides switch the client from Chroma Cloud to VecturaDB, or to Chroma, in Python, JavaScript and .NET: [Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/).

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors.

Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
