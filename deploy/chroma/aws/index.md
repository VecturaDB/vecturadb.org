Source: https://vecturadb.org/deploy/chroma/aws/

[Deploy](https://vecturadb.org/deploy/) / [Chroma](https://vecturadb.org/deploy/chroma/) / AWS

# Deploy Chroma on AWS, in your own account

Chroma 1.5.9 or VecturaDB on one EC2 instance, with HTTPS, from a Launch Stack button. The server and its data stay in your AWS account, AWS bills you directly, and the template is open source.

## The template

### EC2 instance

For a server in use every day.

Estimated AWS cost

12.48 USD a month on your AWS bill

t4g.micro with its volumes and public IPv4, whatever the use.

  * Always on: no wait at the first request
  * On the instance: a query in 2.2 ms, an add in 35 ms
  * Snapshots of the data volume every 24 hours, kept 7 days
  * Chroma 1.5.9, or VecturaDB with API keys

[Launch Stack](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/quickcreate?templateURL=https%3A%2F%2Fvecturadb-deploy.s3.eu-west-1.amazonaws.com%2Faws-v1.1.0%2Fvm%2Ftemplate.yaml&stackName=chroma) [Details](https://vecturadb.org/deploy/chroma/aws/vm/)

**The template is free and open source (Apache 2.0).** You pay only AWS, which bills you directly: no fee from us.

Times: medians in our tests, against the server on the instance itself. Cost: an estimate with the AWS list prices of eu-west-1 in USD, on 29 October 2026, without the snapshots of the backups. The details are on the [page of the template](https://vecturadb.org/deploy/chroma/aws/vm/).

## How it works

  1. ### Open the form

Launch Stack opens the quick-create page of CloudFormation in eu-west-1, in your AWS account. You choose the server, the instance type, the access and the IP addresses that may connect.

  2. ### Create

Tick the three acknowledgements and create the stack. The stack is complete when the server answers over HTTPS.

  3. ### Connect

Open the Outputs tab: `Url` is the address of your server, over HTTPS. The Chroma clients connect to it.

    
    
    import chromadb
    
    client = chromadb.HttpClient(host="<the host in Url>", port=443, ssl=True)

Python, `chromadb` 1.5.9: the connection we ran against the template. VecturaDB with an API key also needs `headers={"x-chroma-token": "<your key>"}`.

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured on 29 October 2026 in eu-west-1: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
