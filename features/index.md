Source: https://vecturadb.org/features/

# What VecturaDB has beyond Chroma 1.5.9

**Disclaimer.** This page is provided as is, without warranty of any kind, as stated in the Apache License 2.0. It describes what we read in the code and measured up to 7 November 2026: your data, versions and setup may behave differently. Back up your data and test on a copy first. You are responsible for your data.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is a single-node server built from Chroma. It has the features of the API of distributed Chroma, the one Chroma Cloud runs on, that Chroma 1.5.9 refuses on a single node: the Search API, sparse vectors and BM25, SPANN, read levels, indexing status, resource names, collection fork, conditional transactions and attached functions. Two attached functions of Chroma Cloud stay out.

VecturaDB is an independent project, not affiliated with Chroma. We read the code of distributed Chroma at commit 52ce844, the main branch of Chroma on 22 October 2026, and of Chroma 1.5.9 on a single node. This page lists each feature that the first has and the second does not, as it is in VecturaDB 1.0.0-preview.8.

## At a glance

Feature | Chroma 1.5.9, single node | VecturaDB 1.0.0-preview.8  
---|---|---  
Search API: dense and sparse ranks, RRF, select | `Search operation is not implemented for local executor` | Yes  
Group by in a search | The same error | Yes  
Sparse vector indexes and BM25 | `Sparse vector indexing is not enabled in local` | Yes  
Sparse vectors in the metadata | `Sparse vector is not supported for local chroma` | Yes  
SPANN index | A collection that asks for SPANN gets HNSW | Yes, for the collections that ask for it  
Read levels of a search | Refused with the Search API | Yes, on SPANN collections  
Indexing status | `Method scout_logs is not implemented` | Yes  
Resource name of a tenant, collection by CRN | The name is not saved; a collection by CRN closes the connection | Yes  
Collection fork and fork count | `Collection forking is unsupported for local chroma` | Yes, as a copy  
Conditional transactions | No | Yes  
Attached functions | Refused | Yes, except `http_generate` and `http_currents`  
Databases: get several by id, get one by id, count | No | Yes  
  
The errors in the middle column are those of Chroma 1.5.9 with the Python client `chromadb` 1.5.9, on 4 November 2026.

Each feature below ends with how it is tested. In our tests on 7 November 2026, every example on this page ran as it is on VecturaDB 1.0.0-preview.8, over HTTP: the Python examples with the Python client `chromadb` 1.5.9, the conditional transactions with the Python package `VecturaDB`, and the commands with `curl`. All 49 checks passed. At every release, the CI of VecturaDB also runs its tests and the Python tests of Chroma, in process: [the run of 1.0.0-preview.8](https://github.com/VecturaDB/VecturaDB/actions/runs/42175717776).

## Search API, BM25 and hybrid search

A search ranks records by a dense vector, a sparse vector or both, merged with RRF. The client computes the BM25 vectors from the documents.
    
    
    hybrid = Rrf(
        ranks=[
            Knn(query=[0, 1, 0], return_rank=True, default=1000),
            Knn(query="apple pie", key="doc_bm25", return_rank=True, default=1000),
        ],
        weights=[0.7, 0.3],
        k=60,
    )
    results = collection.search(Search().where(K("topic") != "tech").rank(hybrid).limit(2))
    

The full example, with Python, JavaScript and .NET: [Hybrid search on your own server](https://vecturadb.org/leaving-chroma-cloud/hybrid-search-without-chroma-cloud).

**Tested.** In our tests on 7 November 2026, the hybrid search above returned `pie` and `fox`. A BM25 rank alone, with `select`, returned `pie` and its document. In the CI, `test_multiple_sparse_vector_indices_e2e` ranks records by two sparse indexes, with a weighted sum and with RRF, and `test_bm25_scores_of_chroma_cloud` checks the BM25 scores that Chroma Cloud gives on 304 documents.

## Group by

A search can keep the best records of each value of a metadata key.
    
    
    from chromadb.execution.expression import GroupBy, MinK
    
    results = collection.search(
        Search()
        .rank(Knn(query=[0, 1, 0]))
        .group_by(GroupBy(keys=K("topic"), aggregate=MinK(keys=K.SCORE, k=1)))
        .limit(3)
    )
    

**Tested.** In our tests on 7 November 2026, the search above kept the nearest record of each topic, on an HNSW collection and on a SPANN collection. With `MaxK` it kept the farthest one. In the CI, the tests of the group-by operator that the single node shares with distributed Chroma pass (`ranked_group_by`), and so do searches with a group by on SPANN collections.

## Sparse vectors in the metadata
    
    
    from chromadb.api.types import SparseVector
    
    collection.add(
        ids=["a"],
        embeddings=[[1, 0]],
        metadatas=[{"terms": SparseVector(indices=[1, 5], values=[0.3, 0.8])}],
    )
    

**Tested.** In our tests on 7 November 2026, the record above read back with its sparse vector. An update changed it, and `None` removed it. In the CI, `test_sparse_metadata_public_roundtrip` also reads sparse vectors with a query and a search.

## SPANN

HNSW stays the default, as in Chroma 1.5.9. A collection that asks for SPANN in its configuration or schema gets a SPANN index. Writes go to the files of the index later, as the compactor of distributed Chroma does, and reads see them at once.

In our tests on one Azure Standard_D8ads_v6 VM (3 November 2026), at commit b64c37f66, before this release, with 1,000 records a second asked for 12 minutes, two runs each:

| VecturaDB | Distributed Chroma 52ce844  
---|---|---  
Records written | 717,300 / 720,000 | 573,700 / 573,400  
Writes refused for backpressure (429) | 1 / 0 | 10 / 15  
  
Distributed Chroma ran on a single-node Kubernetes cluster on the same VM, with all its services. This is a result on one VM, not against a cluster. Recall@10 on 200,000 records: 0.9947 for VecturaDB (Azure Standard_D8ads_v7) and 0.9953 for distributed Chroma (Azure Standard_D8ads_v6).

To turn SPANN off, set `executor: local: spann: false`: every collection then gets HNSW.

Chroma 1.5.9 cannot read a SPANN collection. On a data path written by VecturaDB, Chroma 1.5.9 lists it, but `count`, `get` and `query` fail with `Collection is missing HNSW configuration`. The HNSW collections stay readable, and VecturaDB reads every collection again afterwards.

**Tested.** In our tests on 7 November 2026, a collection with no index settings got HNSW. A collection that asked for SPANN in its configuration got SPANN, and so did one that asked for it in its schema. A query of a SPANN collection returned the nearest records. In another run on the same day, VecturaDB wrote a data folder with two HNSW collections, one of them with a BM25 index, and three SPANN collections, one of them with 300 records already indexed. Chroma 1.5.9 then opened it, in Docker: it listed every collection, but `count`, `get` and `query` failed on the three SPANN collections. On the HNSW collections they returned the records, and an add went through. VecturaDB then read every collection again, the add included. In the CI, more than 100 tests run on SPANN collections, among them reads after deletes and after a restart (`a_spann_collection_reads_back_its_records`).

## Read levels

A search of a SPANN collection takes the read level of distributed Chroma.
    
    
    from chromadb.api.types import ReadLevel
    
    results = collection.search(Search().rank(Knn(query=[0, 1, 0])).limit(1), read_level=ReadLevel.INDEX_ONLY)
    

  * `index_and_wal`, the default, sees every write.
  * `index_only` answers what the last flush holds.
  * `index_and_bounded_wal` also reads a bounded number of records written after it.

**Tested.** In our tests on 7 November 2026, 300 records went into a SPANN collection. Right after the write, `index_only` found none of them, `index_and_bounded_wal` found 250 and `index_and_wal` found 300. After the flush, every level found 300. In the CI: `a_spann_search_reads_the_log_as_its_read_level_asks`.

## Indexing status
    
    
    status = collection.get_indexing_status()
    # IndexingStatus(num_indexed_ops=3, num_unindexed_ops=0, total_ops=3, op_indexing_progress=1.0)
    

**Tested.** In our tests on 7 November 2026, a collection of 3 records gave the status above. In the CI: `indexing_status_on_a_single_node_has_nothing_waiting`.

## Resource names and CRN

A tenant takes a resource name once, and a collection can be read by its CRN, `<resource name>:<database>:<collection>`.
    
    
    curl -X PATCH http://127.0.0.1:8000/api/v2/tenants/default_tenant -H "Content-Type: application/json" -d '{"resource_name": "acme"}'
    curl http://127.0.0.1:8000/api/v2/collections/acme:default_database:docs
    

**Tested.** In our tests on 7 November 2026, in plain HTTP, the two commands above answered 200, and the second one returned the collection `docs`. A second resource name for the same tenant answered 409, and a CRN with a wrong part answered 404. In the CI, over HTTP: `test_resource_name_and_collection_by_crn_on_a_single_node`.

## Collection fork
    
    
    copy = collection.fork("docs-copy")
    collection.fork_count()  # 1
    

**Tested.** In our tests on 7 November 2026, the copy had the records of its source, and `fork_count()` answered 1. A write to the copy left the source as it was. In the CI: `local_fork_copies_records_and_stays_independent`. A fork copies the files of the collection: see Differences from distributed Chroma.

## Conditional transactions

A transaction reads records, buffers writes, and commits them only if no record it read or writes changed after its reads.
    
    
    txn = accounts.conditional()
    balance = txn.get(ids="alice", include=["metadatas"])["metadatas"][0]["balance"]
    txn.update(ids="alice", metadatas={"balance": balance - 30})
    txn.commit()
    

If another client writes `alice` between the read and the commit, the commit raises `ConditionalWriteConflictError` (409) and writes nothing. `collection.conditional().run(callback)` starts the transaction again by itself. They are on by default, as on Chroma Cloud.

They need a client with `conditional()`: the Python package `VecturaDB` (`pip install VecturaDB`), or the JavaScript client in `clients/new-js` of the VecturaDB repository, which is not on npm. The published clients `chromadb` 1.5.9 on PyPI and `chromadb` 3.5.0 on npm do not have them.

In our tests on one Azure Standard_E8as_v7 VM (3 and 4 November 2026), at commit 955e14e74, six servers ran for 6 hours with 8 workers incrementing counters in transactions, half of them with `kill -9` every 20 to 90 s: 0 wrong counters.

**Tested.** In our tests on 7 November 2026, with the Python package `VecturaDB` over HTTP, the transaction above committed. When another client wrote `alice` between the read and the commit, the commit raised `ConditionalWriteConflictError` and wrote nothing. `run()` started the transaction again after a conflict. In the CI: the tests in `test_conditional_transaction.py`.

## Attached functions

A function computes from the records of a collection and writes to its output collection.
    
    
    collection.attach_function(
        name="counter",
        function=RECORD_COUNTER_FUNCTION,
        output_collection="counts",
        params=None,
    )
    

`record_counter`, `statistics` and `revision_history` run after each apply of the records of their input. `count_to_file_async` runs later, from its queue, and writes a file in the data path or on S3.

The Python packages `VecturaDB` and `chromadb` 1.5.9 have `attach_function`. The JavaScript client `chromadb` 3.5.0 does not.

In our tests on one Azure Standard_D8ds_v6 VM (4 November 2026), at commit f20b36d2, with `record_counter` on each collection, VecturaDB did 20.4% to 21.0% more operations than Chroma 1.5.9, which runs no function, under the same load: 3 runs of 6 minutes, 0 wrong answers on either side. `record_counter` reached the final count 1.5 to 1.8 s after the end of the load.

**Tested.** In our tests on 7 November 2026, the `record_counter` above counted 2 records, then 3 after more writes and a delete. The function was read back, then detached with its output collection. In plain HTTP the same day, `statistics` was attached and read back, an asynchronous function took a second input collection, and both were detached. In the CI: `record_counter_counts_the_records_of_its_input_collection`, `count_to_file_async_counts_the_records_of_its_input_collection` and `revision_history_archives_a_delete`.

## Databases by id, and their count

A tenant reads several databases by their ids in one request, one database by its id, and how many databases it has.
    
    
    curl -X POST http://127.0.0.1:8000/api/v2/tenants/default_tenant/databases/batch/get -H "Content-Type: application/json" -d '{"ids": ["00000000-0000-0000-0000-000000000000"]}'
    curl http://127.0.0.1:8000/api/v2/tenants/default_tenant/databases/by-id/00000000-0000-0000-0000-000000000000
    curl http://127.0.0.1:8000/api/v2/tenants/default_tenant/databases_count
    

On VecturaDB, `00000000-0000-0000-0000-000000000000` is the id of `default_database`.

**Tested.** In our tests on 7 November 2026, in plain HTTP, the three commands above returned `default_database` and a count of 1 on a new server. A database read by its id was the one with that id, and an id that no database has answered 404. A read of several ids returned each database once and left out the unknown id. The count went from 1 to 3 after two new databases. In the CI, over HTTP: `test_bulk_database_lookup` for several ids and `test_count_databases_is_tenant_scoped` for the count.

## Differences from distributed Chroma

  * **Fork.** A fork copies the files of the collection, so it takes time and disk space in proportion to the collection. Distributed Chroma makes a fork share the files of its source, and writes new files only for what changes.
  * **Read levels.** On the single node, filters and sparse ranks read the current data of the records below `index_and_wal`. A filter judges a record updated after the flush by its new metadata, and leaves out a record deleted after it.
  * **Indexing status.** Distributed Chroma counts the operations of its log; the single node counts the records, so 3 adds and then 2 deletes count 1 and not 5.
  * **Version of an HNSW collection.** It goes up with each write, as the single node applies the write before it answers. Distributed Chroma raises it later, with each compaction.
  * **Count of a SPANN collection.** In our tests on one Azure Standard_D8ads_v6 VM (3 November 2026), at commit b64c37f66, before this release, with about 2,300,000 records, a count at rest took 317 to 328 ms, against 160 to 218 ms for distributed Chroma 52ce844. One run each.
  * **Attached functions and Chroma 1.5.9.** Chroma 1.5.9 opens a data path with attached functions, but does not run them. A synchronous function catches up once VecturaDB opens the data path again. An asynchronous function misses the deletes and updates that Chroma 1.5.9 made to records that already existed: detach it and attach it again with a new file to count again.
  * **A synchronous function that stops.** After 5 failures in a row, distributed Chroma stops compacting the collection, and a compaction asked by hand starts it again. On the single node the function stops, and starts again when detached with its output collection and attached again, which computes its output again from the records: `revision_history` then loses the revisions it archived.
  * **`http_generate` and `http_currents`.** They are part of Foundations, a service of Chroma Cloud. They can be attached, but each run fails, and they stop after 5 failures.
  * **Conditional transactions.** Some answers differ from those of Chroma Cloud: see [the README](https://github.com/VecturaDB/VecturaDB#conditional-transactions).

## Differences from Chroma 1.5.9

Chroma 1.5.9 cannot read the SPANN collections of a data path: see SPANN.

On an idle server, a get by id is slower than on Chroma 1.5.9. Under writes it is faster. In our tests on one Azure Standard_E8s_v7 VM (4 November 2026), at commit ac50984b5, on HNSW with 100,000 records, two runs each:

Median, ms | Chroma 1.5.9 | VecturaDB  
---|---|---  
Idle, 1 id | 1.04 / 1.08 | 1.20 / 1.20  
Under writes, 1 id, p99 | 35.10 / 37.06 | 4.11 / 4.13  
  
## What stays out, and why

These are services or products of Chroma Cloud, not features of the database:

  * **Quotas.** The limits of a Chroma Cloud account, answered with 422 `Quota exceeded`. The open-source code of distributed Chroma does not enforce them.
  * **Accounts and billing.** VecturaDB has API keys of its own, set in its configuration.
  * **Foundations.** A service of Chroma Cloud for teams of agents. It needs hosted services, and distributed Chroma leaves it off by default.
  * **`http_generate` and `http_currents`.** The two attached functions of Foundations: see above.

Some parts of distributed Chroma exist to run it on several services, and have no use on one node: the counter of failed compactions, the two-phase garbage collection of versions, and the system database across regions.

The hosted embedding functions `chroma-cloud-qwen` and `chroma-cloud-splade` ran on the servers of Chroma Cloud. The Python package `VecturaDB` computes them on your machine, with the same names and configuration.
