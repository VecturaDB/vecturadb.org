Source: https://vecturadb.org/deploy/vecturadb/gcp/

[Deploy](https://vecturadb.org/deploy/) / [VecturaDB](https://vecturadb.org/deploy/vecturadb/) / Google Cloud

# Deploy VecturaDB on Google Cloud, in your own project

VecturaDB on one Compute Engine VM, with HTTPS and API keys, from an Open in Cloud Shell button and a guide with VecturaDB already chosen. The server and its data stay in your Google Cloud project, Google bills you directly, and the template is open source.

## The template

### Compute Engine VM

For a server in use every day.

Estimated Google Cloud cost

12.98 USD a month on your Google Cloud bill

e2-micro with its disks and external IP, whatever the use. The API key adds 0.06 USD a month beyond the 6 free secret versions of the billing account.

  * Always on: no wait at the first request
  * HTTPS only from the IP addresses you allow
  * Snapshots of the data disk every 24 hours, kept 7 days
  * API keys, kept in Secret Manager and not in the state of Terraform

[Open in Cloud Shell](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FVecturaDB%2FVecturaDB.Deploy&cloudshell_git_branch=gcp-v1.0.1&cloudshell_workspace=gcp%2Fvm&cloudshell_tutorial=tutorial-vecturadb.md) [Details](https://vecturadb.org/deploy/vecturadb/gcp/vm/)

**The template is free and open source (Apache 2.0).** You pay only Google Cloud, which bills you directly: no fee from us.

Cost: an estimate with the Google Cloud list prices of europe-west1 in USD, on 4 November 2026, without the snapshots of the backups. The details are on the [page of the template](https://vecturadb.org/deploy/vecturadb/gcp/vm/).

## How it works

  1. ### Open Cloud Shell

The button opens Cloud Shell, the terminal of your Google Cloud console, with the template and a guide on the side, with VecturaDB already chosen. Google asks to confirm the clone of the repository: without “Trust repo”, Cloud Shell is temporary, and the guide signs you in.

  2. ### Follow the guide

Choose the project, then run the commands of the guide: they install Terraform, keep its state in a bucket of your project, ask the IP address that may connect and the API key, and create everything. In our tests the server answered over HTTPS in 6 to 11 minutes.

  3. ### Connect

The `url` output is the address of your server, over HTTPS. The Chroma clients connect to it with the API key.

    
    
    import chromadb
    
    client = chromadb.HttpClient(host="<the host in url>", port=443, ssl=True,
                                 headers={"x-chroma-token": "<your key>"})

Python, `chromadb` 1.5.9: the connection we ran against the template with VecturaDB. Without the key, the server refuses the requests.

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured with VecturaDB 1.0.0-preview.7 on 5 November 2026 in europe-west1: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
