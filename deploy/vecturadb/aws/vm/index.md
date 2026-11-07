Source: https://vecturadb.org/deploy/vecturadb/aws/vm/

[Deploy](https://vecturadb.org/deploy/) / [VecturaDB](https://vecturadb.org/deploy/vecturadb/) / [AWS](https://vecturadb.org/deploy/vecturadb/aws/)

# VecturaDB on an AWS EC2 instance

One VecturaDB server in your own AWS account, with its data on an EBS volume, HTTPS, API keys, allowed IP addresses and snapshots. From about 12.50 USD a month on your AWS bill.

[Launch Stack](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/quickcreate?templateURL=https%3A%2F%2Fvecturadb-deploy.s3.eu-west-1.amazonaws.com%2Faws-v1.2.2%2Fvm%2Ftemplate.yaml&stackName=vecturadb&param_Engine=vecturadb) [README of the template](https://github.com/VecturaDB/VecturaDB.Deploy/tree/aws-v1.2.2/aws/vm)

**Disclaimer.** This template and its scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured with VecturaDB 1.0.0-preview.8 on 6 November 2026 in eu-west-1: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

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

The template runs **VecturaDB 1.0.0-preview.8** (`ghcr.io/vecturadb/vecturadb:1.0.0-preview.8`), built from Chroma, with sparse vectors, BM25, hybrid search, collection fork and API keys. The same template can also run Chroma 1.5.9.

VecturaDB keeps the Chroma API: the Chroma clients connect with the URL of the stack and the API key. In our tests the Python client (chromadb 1.5.9) worked over HTTPS with the key, and VecturaDB answered 401 without it.

Resource| Notes  
---|---  
EC2 instance, Ubuntu 24.04| Docker runs the server; Caddy serves HTTPS in front of it  
EBS data volume, gp3| Mounted at `/var/lib/chroma`; 16 GiB by default, encrypted  
Security group| Opens only what the access mode needs  
VPC, subnet and internet gateway| 10.42.0.0/16, in the first availability zone of the region  
Elastic IP| The address for HTTPS, and the way out to the package and image registries  
IAM role of the instance| Systems Manager runs the configuration and the restore: there is no SSH  
Systems Manager documents and association| The configuration, run at the creation and at every update that changes it; the restore  
Secrets Manager secret| The API key  
Data Lifecycle Manager policy| Only with backups on: snapshots of the data volume  
  
## Deploy

[Launch Stack](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/quickcreate?templateURL=https%3A%2F%2Fvecturadb-deploy.s3.eu-west-1.amazonaws.com%2Faws-v1.2.2%2Fvm%2Ftemplate.yaml&stackName=vecturadb&param_Engine=vecturadb)

The button opens the quick-create page of CloudFormation in eu-west-1, with the template of the tag `aws-v1.2.2`, VecturaDB already chosen and `vecturadb` as the name of the stack. CloudFormation reads templates from Amazon S3, so the button uses a copy of the template in a public bucket.

  1. Fill the parameters, in three groups: Server (images, instance type, size of the data volume), Access (access mode, allowed IP ranges, API key, domain, email for Let's Encrypt) and Backups. The API key is required for public access.
  2. Under “Capabilities and transforms”, tick the three acknowledgements: IAM resources, IAM resources with custom names, and `CAPABILITY_AUTO_EXPAND`.
  3. Choose “Create stack”. When the status is `CREATE_COMPLETE`, the Outputs tab has the `Url` for the clients.

In our tests| Time  
---|---  
Stack from zero, until the server answered over HTTPS| 521 s  
  
Most of the creation is the first boot of the instance, which installs Docker and Caddy. A new instance in standard credit mode has no CPU credits yet, so it runs at the baseline CPU: in our tests the credit balance was 0 during the first boot.

With the AWS CLI:
    
    
    aws cloudformation create-stack --region eu-west-1 --stack-name my-vecturadb \
      --template-url https://vecturadb-deploy.s3.eu-west-1.amazonaws.com/aws-v1.2.2/vm/template.yaml \
      --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
      --parameters ParameterKey=Engine,ParameterValue=vecturadb ParameterKey=ApiKey,ParameterValue=<your key> \
                   ParameterKey=Access,ParameterValue=allowed-ips \
                   ParameterKey=AllowedIpRanges,ParameterValue=203.0.113.10/32
    aws cloudformation wait stack-create-complete --region eu-west-1 --stack-name my-vecturadb
    aws cloudformation describe-stacks --region eu-west-1 --stack-name my-vecturadb --query "Stacks[0].Outputs"

The template and its README are in the [VecturaDB.Deploy repository](https://github.com/VecturaDB/VecturaDB.Deploy), under [`aws/vm`](https://github.com/VecturaDB/VecturaDB.Deploy/tree/aws-v1.2.2/aws/vm).

## Access and HTTPS

Access| What is open| Address  
---|---|---  
Allowed IP addresses| 443 from your IP ranges; 80 for the certificate only| https://, with the Elastic IP or your domain  
Public| 443 and 80 from anywhere; only with an API key| https://  
Internal| Nothing from the internet; port 8000 inside the VPC| http://, on the private address  
  
  * Every request needs the API key, in the `x-chroma-token` header. The stack keeps the key in Secrets Manager, and the instance writes it to a file readable by root only.
  * Caddy gets a Let's Encrypt certificate and forwards to the server on 127.0.0.1.
  * Let's Encrypt gives no certificate for the names that AWS gives to instances. Without a domain, the certificate is for the Elastic IP itself, valid for 160 hours, and Caddy renews it.
  * Port 80 answers only the challenge of the certificate. Port 22 stays closed and the instance has no key pair: for a shell, use Session Manager.
  * The stack is complete only when Caddy holds the certificate and the server answers.

On the instance, against the server on 127.0.0.1, with the API key (median of 20 runs, t4g.micro)| Time  
---|---  
Query| 2.4 ms  
Get| 2.3 ms  
Add of 2 records| 17.2 ms  
8 concurrent writers, in all| 2.1 s  
  
## Cost

The sizes we tested, with the list prices of eu-west-1 in USD for 730 hours a month, on 29 October 2026:

Size| CPU, memory| Instance| Root volume 8 GiB| Data volume 16 GiB| Public IPv4| Total a month  
---|---|---|---|---|---|---  
t4g.micro (default, Arm)| 2, 1 GiB| 6.72| 0.70| 1.41| 3.65| 12.48  
t4g.small (Arm)| 2, 2 GiB| 13.43| 0.70| 1.41| 3.65| 19.19  
  
  * The API key adds the secret: 0.40 USD a month, plus 0.05 USD per 10,000 reads.
  * With internal access the Elastic IP stays: it is the way out to the internet, as there is no NAT gateway.
  * Not in the table: outbound traffic and the snapshots of the backups.
  * The t4g and t3 types have a baseline CPU and earn credits below it: 10% of each vCPU for t4g.micro and t3.micro, 20% for the small and medium sizes ([the credit table](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html)). The stack sets the standard credit mode: without credits the CPU stays at the baseline, and nothing is billed beyond the price of the instance. A server that is busy all the time needs a larger size.
  * With 1 GiB of memory, VecturaDB used 49 MiB after our operations bench, with 449 MiB available on the instance. We measured only small collections: VecturaDB keeps its vector index in memory, so a large collection needs a larger size.

## Backups and restore

  * With backups on, the default, Amazon Data Lifecycle Manager takes snapshots of the data volume every 24 hours, or every 4, 6, 8 or 12 hours, and keeps them 7 days.
  * Data Lifecycle Manager has no fee. The snapshots are billed at 0.05 USD per GB a month in eu-west-1: the first one for the used part of the volume, the next ones for the changes.
  * **The snapshots are not part of the stack:** deleting the stack leaves them.
  * The snapshots are taken while the server runs, so a restored volume is like a volume after a power cut. In our tests its file system recovered its journal, and VecturaDB started on it with all the data of the snapshot.
  * A snapshot taken while the server saves the index of a collection can give that collection back broken, as a power cut would. It can happen to a collection of more than 1,000 records, where the server starts saving its index, with Chroma 1.5.9 and with VecturaDB. In our tests of 6 November 2026 it happened twice, each time to a collection of 2,000 records added a few seconds before the backup: on AWS with VecturaDB (“Error creating hnsw segment writer”) and on Container Apps with Chroma 1.5.9 (“Error getting embedding”). So take an on-demand snapshot while nobody writes. The scheduled ones are set at 02:00 UTC: keep the writes away from that hour.

### Restore

  1. Create a volume from a snapshot in the availability zone of the instance, and attach it.
  2. Run the `RestoreDocument` of the stack: it stops the server, replaces the data with the data of the snapshot, and starts the server again.
  3. Detach and delete the volume.

    
    
    STACK=my-vecturadb; SNAPSHOT=<snapshot id>
    out() { aws cloudformation describe-stacks --stack-name $STACK --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
    INSTANCE=$(out InstanceId); DOCUMENT=$(out RestoreDocument)
    AZ=$(aws ec2 describe-instances --instance-ids $INSTANCE --query "Reservations[0].Instances[0].Placement.AvailabilityZone" --output text)
    VOLUME=$(aws ec2 create-volume --snapshot-id $SNAPSHOT --availability-zone $AZ --volume-type gp3 --encrypted --query VolumeId --output text)
    aws ec2 wait volume-available --volume-ids $VOLUME
    aws ec2 attach-volume --volume-id $VOLUME --instance-id $INSTANCE --device /dev/sdg
    aws ec2 wait volume-in-use --volume-ids $VOLUME
    COMMAND=$(aws ssm send-command --document-name $DOCUMENT --instance-ids $INSTANCE --parameters volumeId=$VOLUME --query Command.CommandId --output text)
    until aws ssm get-command-invocation --command-id $COMMAND --instance-id $INSTANCE --query Status --output text 2>/dev/null | grep -qE 'Success|Failed|Cancelled|TimedOut'; do sleep 5; done
    aws ssm get-command-invocation --command-id $COMMAND --instance-id $INSTANCE --query "[Status,StandardOutputContent]" --output text
    aws ec2 detach-volume --volume-id $VOLUME
    aws ec2 wait volume-available --volume-ids $VOLUME
    aws ec2 delete-volume --volume-id $VOLUME

**The data written after the snapshot is lost:** take a snapshot first if you may want it back. The data volume stays the same, so the snapshots go on.

In our tests| Time  
---|---  
Snapshot by hand, until completed| 50 s  
Volume from the snapshot| 18-19 s  
Attach| 4-5 s  
`RestoreDocument`, with 5 MB of data| 10-13 s  
Detach and delete| 21 s  
  
After the restore VecturaDB held the collection of 250 records written before the snapshot, and none of the records written after it. A snapshot taken right after a restore, restored in turn, also held the collection written between the two.

## Updates

  * To change the server, its image, the key or the access, update the stack with the template of the release from the bucket, and the new values: Systems Manager pulls the image, stops the old container and starts the new one, with the data on the data volume. An update that changes none of them does not restart the server.
  * In our tests an update that kept the template in use (`--use-previous-template`) and changed only `VecturaDBImage` did nothing: CloudFormation answered “No updates are to be performed”. With the AWS CLI, list every parameter of the template in a file, the new values with `ParameterValue` and the others with `UsePreviousValue`, for example `parameters.json` for another image of VecturaDB: 
        
        [
          {"ParameterKey": "Engine", "UsePreviousValue": true},
          {"ParameterKey": "ChromaImage", "UsePreviousValue": true},
          {"ParameterKey": "VecturaDBImage", "ParameterValue": "ghcr.io/vecturadb/vecturadb:1.0.0-preview.8"},
          {"ParameterKey": "InstanceType", "UsePreviousValue": true},
          {"ParameterKey": "DataVolumeSizeGB", "UsePreviousValue": true},
          {"ParameterKey": "Access", "UsePreviousValue": true},
          {"ParameterKey": "AllowedIpRanges", "UsePreviousValue": true},
          {"ParameterKey": "ApiKey", "UsePreviousValue": true},
          {"ParameterKey": "DomainName", "UsePreviousValue": true},
          {"ParameterKey": "AcmeEmail", "UsePreviousValue": true},
          {"ParameterKey": "Backup", "UsePreviousValue": true},
          {"ParameterKey": "BackupEveryHours", "UsePreviousValue": true},
          {"ParameterKey": "BackupRetentionDays", "UsePreviousValue": true}
        ]
        
        aws cloudformation update-stack --region eu-west-1 --stack-name my-vecturadb \
          --template-url https://vecturadb-deploy.s3.eu-west-1.amazonaws.com/aws-v1.2.2/vm/template.yaml \
          --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --parameters file://parameters.json
        aws cloudformation wait stack-update-complete --region eu-west-1 --stack-name my-vecturadb

  * We tested the update with the AWS CLI only, not in the console. In our tests the update of the image took 35 seconds, and the server held all the records written before it.
  * The server does not answer during the switch.
  * An update never replaces the instance, so it never moves the data volume. A change between t4g (Arm) and t3 (x86) needs a new stack and a restore.
  * Docker starts only once the data volume is mounted: an instance that boots without it serves nothing, rather than an empty database.
  * Ubuntu installs its security updates by itself. Caddy comes from its own repository: you update it.

## Delete everything

Deleting the stack deletes the instance, the data volume, the network, the Elastic IP, the roles, the documents and the secret with the API key. The snapshots stay: delete them yourself, after the stack, so that no new snapshot comes after the cleanup.

### In the console

  1. In CloudFormation, select the stack, choose Delete and type the name of the stack to confirm.
  2. In EC2, under Snapshots, delete the snapshots with the tag `chroma-backup` equal to the name of the stack.

### With the AWS CLI
    
    
    aws cloudformation delete-stack --region eu-west-1 --stack-name my-vecturadb
    aws cloudformation wait stack-delete-complete --region eu-west-1 --stack-name my-vecturadb
    for s in $(aws ec2 describe-snapshots --region eu-west-1 --owner-ids self \
        --filters Name=tag:chroma-backup,Values=my-vecturadb --query "Snapshots[].SnapshotId" --output text); do
      aws ec2 delete-snapshot --region eu-west-1 --snapshot-id $s
    done

In our tests the deletion of the stack took 64 seconds, with the CLI, and afterwards nothing of the stack was left in the region, the secret with the API key included.

## Limits

  * One instance and one volume: no high availability.
  * While the instance restarts or an update switches the container, the server does not answer.
  * The snapshots are in the same region.
  * The subnet is in the first availability zone of the region. In eu-west-1 all three zones offer t4g.micro; where the first zone does not offer a type, choose another one.
  * The certificate of an IP address is valid for about 6 days: Caddy renews it while the instance runs.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors.

Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
