Source: https://vecturadb.org/news/chroma-cloud-wind-down/

[News](https://vecturadb.org/news/)

# Chroma is joining Replit, and Chroma Cloud is winding down

_Federico Laurianti, 25 October 2026_

**Updated on 4 November 2026:** Chroma moved the end of writes from 22 November to 7 December 2026.

On 23 October 2026 Chroma announced that it has signed a definitive agreement to join Replit. In the same announcement, [Chroma is joining Replit](https://www.trychroma.com/blog/chroma-joins-replit), Chroma writes that it is winding down its existing cloud service over the next 60 days.

## The Chroma Cloud timeline

Chroma published the dates on the same day, in the [Chroma Cloud wind-down timeline](https://www.trychroma.com/cloud-wind-down):

  * **7 December 2026:** Chroma Cloud becomes read-only. Existing data stays available for reads for the following 15 days.
  * **22 December 2026:** Chroma Cloud no longer serves read requests. All exports and migration work must be complete before this date.

The wind-down applies only to the Chroma Cloud service. Open-source Chroma remains available under the Apache License 2.0, and Replit will continue contributing to the project. Chroma also writes that it has committed additional code from its private repositories to the Apache 2.0 repository.

## If your data is on Chroma Cloud

The timeline asks you to stop or redirect the workloads that write to Chroma Cloud, and to begin exporting and validating the data you need, before 7 December 2026. All exports must be finished before 22 December 2026.

There are two open-source destinations, and both keep the Chroma API:

  * **Chroma, on your own infrastructure:** the single-node server, Chroma 1.5.9, or the distributed deployment on Kubernetes.
  * **VecturaDB:** a single-node server built from Chroma, with Chroma Cloud's sparse vectors, BM25, hybrid search and collection fork. VecturaDB complements Chroma; it does not replace it.

The [Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/) guides describe the move to each destination step by step, with the commands and the checks we ran. A page on [hosted embedding models](https://vecturadb.org/leaving-chroma-cloud/hosted-embedding-models) applies to all three guides.

For questions about your Chroma Cloud account, the wind-down timeline lists Chroma's support contact. For questions about the guides or VecturaDB, [open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new).

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors.

Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
