Source: https://vecturadb.org/deploy/chroma/gcp/vm/

[Deploy](https://vecturadb.org/deploy/) / [Chroma](https://vecturadb.org/deploy/chroma/) / [Google Cloud](https://vecturadb.org/deploy/chroma/gcp/)

# Chroma or VecturaDB on a Google Cloud VM

One server in your own Google Cloud project, with its data on a disk of its own, HTTPS, allowed IP addresses and snapshots. From about 13 USD a month on your Google Cloud bill.

[Open in Cloud Shell](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FVecturaDB%2FVecturaDB.Deploy&cloudshell_git_branch=gcp-v1.1.0&cloudshell_workspace=gcp%2Fvm&cloudshell_tutorial=tutorial-chroma.md) [README of the template](https://github.com/VecturaDB/VecturaDB.Deploy/tree/gcp-v1.1.0/gcp/vm)

**Disclaimer.** This template and its scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured on 5 and 6 November 2026 in europe-west1: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

On this page

  1. What it creates
  2. Deploy
  3. Access and HTTPS
  4. Cost
  5. Backups and restore
  6. Updates
  7. Delete everything
  8. Limits

## What it creates

The template runs one of two servers:

  * **Chroma 1.5.9** , the open-source single-node server (`ghcr.io/chroma-core/chroma:1.5.9`);
  * **VecturaDB 1.0.0-preview.8** , built from Chroma, with sparse vectors, BM25, hybrid search, collection fork and API keys.

Both keep the Chroma API: the Chroma clients connect with the `url` output. In our tests the Python client (chromadb 1.5.9) worked over HTTPS with both servers.

Resource| Notes  
---|---  
Compute Engine VM, Ubuntu 24.04| Docker runs the server; Caddy serves HTTPS in front of it  
Data disk, pd-balanced| Mounted at `/var/lib/chroma`; 16 GB by default  
VPC, subnet and firewall rules| 10.42.0.0/24; the rules open only what the access mode needs  
Static external IP address| The address for HTTPS, and the way out to the package and image registries  
Service account of the VM| No role in the project; it may read only the secret of the API key  
Snapshot schedule| Only with backups on: snapshots of the data disk  
Secret Manager secret| Only VecturaDB with an API key  
  
## Deploy

[Open in Cloud Shell](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FVecturaDB%2FVecturaDB.Deploy&cloudshell_git_branch=gcp-v1.1.0&cloudshell_workspace=gcp%2Fvm&cloudshell_tutorial=tutorial-chroma.md)

Google Cloud has no form that creates a deployment from a link. The button opens Cloud Shell, the terminal of the Google Cloud console, with the template of the tag `gcp-v1.1.0` and a guide on the side, which runs Terraform step by step.

  1. Google asks to confirm the clone of the repository. Without “Trust repo”, Cloud Shell is temporary: its files are deleted at the end of the session, and it has no credentials until the guide signs you in. If Google asks to authorize Cloud Shell when it opens, it is not needed: click outside it to close it, the guide signs you in. In a temporary Cloud Shell `gcloud auth login` first says that you are already authenticated: answer `Y`.
  2. The guide turns on the APIs that the template uses, installs Terraform, and creates a Cloud Storage bucket for the state of Terraform, `<project id>-chroma-tfstate`, with versioning and without public access.
  3. You give the IP address of your computer, then `terraform apply` creates everything. The settings file goes to the bucket too, next to the state.

To change a setting or delete the deployment later, open the guide again: it gets the state and the settings back from the bucket.

In our tests| Time  
---|---  
Deployment from zero, until the server answered over HTTPS| 376-626 s  
Terraform installed in Cloud Shell| about 40 s  
  
Most of the creation is the first boot of the VM, which installs Docker and Caddy from the package repositories, so its time depends on them. In the test of 626 seconds the first boot took 6 minutes 29 seconds, and the list of the Ubuntu packages alone 2 minutes 6 seconds.

With Terraform 1.11 or later on your computer:
    
    
    cd gcp/vm
    gcloud services enable compute.googleapis.com iam.googleapis.com secretmanager.googleapis.com storage.googleapis.com
    gcloud storage buckets create gs://<bucket> --location=europe-west1 --uniform-bucket-level-access --public-access-prevention
    terraform init -backend-config=bucket=<bucket> -backend-config=prefix=chroma
    export TF_VAR_project_id=<project id>
    terraform apply -parallelism=2 -var-file=chroma.tfvars -var 'allowed_ip_ranges=["203.0.113.10/32"]'

For VecturaDB with an API key, use `vecturadb.tfvars` and `export TF_VAR_api_key=<your key>` first. The template and its README are in the [VecturaDB.Deploy repository](https://github.com/VecturaDB/VecturaDB.Deploy), under [`gcp/vm`](https://github.com/VecturaDB/VecturaDB.Deploy/tree/gcp-v1.1.0/gcp/vm).

The commands run Terraform with two operations at a time: in our tests from Cloud Shell, with the default of 10, 5 plans out of 11 failed with a refused connection to the Google APIs, and with 2 none out of 11.

## Access and HTTPS

Access| What is open| Address  
---|---|---  
Allowed IP addresses| 443 from your IP ranges; 80 for the certificate only| https://, with the external IP or your domain  
Public| 443 and 80 from anywhere; VecturaDB with an API key only| https://  
Internal| Nothing from the internet; port 8000 inside the VPC| http://, on the private address  
  
  * Caddy gets a Let's Encrypt certificate and forwards to the server on 127.0.0.1.
  * Without a domain, the certificate is for the external IP itself, and Caddy renews it.
  * Port 80 answers only the challenge of the certificate. There is no SSH: the agent of the VM reads its settings from the metadata of the VM.
  * `terraform apply` ends only when Caddy holds the certificate and the server answers.
  * Chroma 1.5.9 has no API keys: public access needs VecturaDB with a key, sent in the `x-chroma-token` header. The key goes to Secret Manager as a write-only value: it is not in the state of Terraform.

## Cost

The sizes of the template, with the list prices of europe-west1 in USD for 730 hours a month, on 4 November 2026:

Size| CPU, memory| VM| Boot disk 10 GB| Data disk 16 GB| External IP| Total a month  
---|---|---|---|---|---|---  
e2-micro (default)| 2 shared vCPU, 1 GB| 6.73| 1.00| 1.60| 3.65| 12.98  
e2-small| 2 shared vCPU, 2 GB| 13.45| 1.00| 1.60| 3.65| 19.70  
e2-medium| 2 shared vCPU, 4 GB| 26.91| 1.00| 1.60| 3.65| 33.16  
  
  * We tested only e2-micro.
  * The e2 shared-core types run at a fraction of a vCPU and burst above it for short periods: e2-micro at 0.25 of a vCPU, e2-small at 0.5, e2-medium at 1. A server that is busy all the time needs a larger size.
  * VecturaDB with an API key adds the secret: 0.06 USD a month beyond the 6 free secret versions of the billing account.
  * Not in the table: outbound traffic, the snapshots of the backups and the bucket of the state, a few KB.

## Backups and restore

  * With backups on, the default, a snapshot schedule of Compute Engine takes snapshots of the data disk every 24 hours, or every 4, 6, 8 or 12 hours, and keeps them 7 days.
  * The snapshots are billed at 0.05 USD per GB a month in europe-west1, for the data they hold.
  * **The snapshots are not part of the deployment:** `terraform destroy` leaves them.
  * The snapshots are taken while the server runs, so a restored disk is like a disk after a power cut: the restore checks its file system before it uses it.

### Restore

In the folder of the template, after `terraform init` with the same bucket and folder:
    
    
    gcloud compute snapshots list --filter="labels.chroma-backup=chroma"
    ./restore.sh <snapshot name>

`restore.sh` creates a disk from the snapshot and attaches it to the VM. Then the agent of the VM stops the server, replaces the data with the data of the snapshot, and starts the server again. In the end the script detaches and deletes the disk. **The data written after the snapshot is lost:** take a snapshot first if you may want it back. The data disk stays the same, so the snapshots go on.

In our tests| Time  
---|---  
Snapshot by hand| 32-48 s  
Disk from the snapshot| 23-26 s  
Attach| 6-20 s  
Copy on the VM, until the server answers| 7-9 s  
Detach and delete| 8-10 s  
  
With Chroma 1.5.9 and with VecturaDB 1.0.0-preview.8, after each restore the server held all the collections of the snapshot, also the one written right before it.

## Updates

  * To change the server, its image, the access or the key, open the guide again, change the settings and apply: the agent of the VM pulls the image, stops the old container and starts the new one, with the data on the data disk. An apply that changes none of them does not restart the server.
  * The server does not answer during the switch.
  * An apply never replaces the VM, so it never moves the data disk.
  * Docker starts only once the data disk is mounted: a VM that boots without it serves nothing, rather than an empty database.
  * Ubuntu installs its security updates by itself. Caddy comes from its own repository, which they leave out.

In our tests a switch from Chroma 1.5.9 to VecturaDB with an API key took 25 seconds, and VecturaDB read the collections written by Chroma.

## Delete everything

`terraform destroy` deletes the VM, the data disk, the network, the IP address, the service account and the secret. The snapshots stay: delete them after the VM, so that no new snapshot comes after the cleanup. Then delete the state and the settings in the bucket. The last step of the guide has the same commands.
    
    
    terraform destroy -parallelism=2 -var-file=chroma.tfvars && for s in $(gcloud compute snapshots list --filter="labels.chroma-backup=chroma" --format="value(name)" --verbosity=error); do gcloud compute snapshots delete $s --quiet; done && gcloud storage rm --recursive --all-versions gs://$BUCKET/chroma

In our tests `terraform destroy` took 99-141 seconds from a computer; afterwards nothing of the deployment was left in the project.

## Limits

  * One VM and one disk: no high availability.
  * While the VM restarts or an update switches the container, the server does not answer.
  * The snapshots are in the same region.
  * The certificate of an IP address is valid for about 6 days: Caddy renews it while the VM runs.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors.

Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
