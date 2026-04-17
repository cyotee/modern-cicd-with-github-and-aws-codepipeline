# AWS Demo Runbook

This runbook deploys the current repository to AWS in a way that matches the code that actually works today.

It demonstrates:

- GitHub Actions for CI on frontend and backend changes
- AWS SAM for the initial backend deployment
- AWS CDK for base hosting and pipeline support infrastructure
- AWS CodePipeline for frontend continuous deployment to S3 and CloudFront

It does **not** rely on the backend CodePipeline path in this repository, because that path is incomplete in the current codebase.

## What You Will Deploy

- Backend API: API Gateway + Lambda + DynamoDB from `backend/template.yaml`
- Frontend hosting: S3 + CloudFront from `infrastructure/lib/base-infra-stack.ts`
- Frontend CD pipeline: `infrastructure/frontend-pipeline.yaml`

## Current Live Deployment

At the time this runbook was last updated, the deployed demo endpoints were:

- CloudFront frontend: `https://d3j6g6xdwtde3x.cloudfront.net`
- Backend API: `https://u5d3c9gned.execute-api.us-west-2.amazonaws.com/dev`
- Frontend bucket: `hotel-frontend-965278178394-us-west-2`
- CloudFront distribution: `E2S9Y1T050L2SC`

The live frontend currently renders `AWS Hotel` as the visible hotel name.

## Prerequisites

Install these tools locally on macOS:

```bash
brew install awscli aws-sam-cli
npm install -g aws-cdk
```

You also need:

- A GitHub fork of this repository
- An AWS account
- AWS CLI profile `personal`
- Node.js 18+

## Repository Setup

From the repository root:

```bash
npm ci
```

## AWS Profile Setup

Use your AWS CLI profile for all commands in this runbook:

```bash
export AWS_PROFILE=personal
export AWS_REGION=us-west-2
export AWS_SDK_LOAD_CONFIG=1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile "$AWS_PROFILE")
export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
export CDK_DEFAULT_REGION=$AWS_REGION
export GITHUB_REPO=cyotee/modern-cicd-with-github-and-aws-codepipeline
```

Verify the account and profile:

```bash
aws sts get-caller-identity --profile "$AWS_PROFILE"
```

If your AWS profile uses IAM Identity Center or shared config-based credentials, `AWS_SDK_LOAD_CONFIG=1` is important for CDK commands.

If CDK still says no credentials are configured even though `aws sts get-caller-identity` works, export the resolved credentials from AWS CLI into your shell before running CDK:

```bash
eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
```

Verify the exported credentials are active:

```bash
AWS_PAGER='' aws sts get-caller-identity --no-cli-pager
```

## Restart the Demo Cleanly

Use this section if you want to tear down and rebuild the demo from scratch after a failed or partial deployment.

### What to Keep

You usually want to keep these in place:

- Your AWS CLI profile `personal`
- Your GitHub fork of the repository
- Your AWS CodeConnections connection to GitHub
- The CDK bootstrap stack `CDKToolkit`

### What to Delete for a Fresh Demo Restart

Delete these application resources before rebuilding:

- CloudFormation stack `hotel-frontend-pipeline`
- CloudFormation stack `hotel-backend-dev`
- CDK stack `HotelBaseInfraStack`
- SSM parameter `/hotelapp/api/url`

### Teardown Commands

Run these from the repository root:

```bash
aws cloudformation delete-stack \
  --stack-name hotel-frontend-pipeline \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

aws cloudformation wait stack-delete-complete \
  --stack-name hotel-frontend-pipeline \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

aws cloudformation delete-stack \
  --stack-name hotel-backend-dev \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

aws cloudformation wait stack-delete-complete \
  --stack-name hotel-backend-dev \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

aws ssm delete-parameter \
  --name /hotelapp/api/url \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true
```

Then destroy the base infrastructure stack:

```bash
cd infrastructure
npm install
eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
./node_modules/.bin/cdk destroy HotelBaseInfraStack --force
cd ..
```

If `npx cdk` offers to install a different `cdk` version, stop and run `npm install` in `infrastructure` first. The command should use the local binary in `infrastructure/node_modules/.bin`, not an ad hoc global install.

### Optional: Delete CDK Bootstrap Too

You usually do not need to delete `CDKToolkit`. Only do this if you want a completely fresh CDK environment:

```bash
aws cloudformation delete-stack \
  --stack-name CDKToolkit \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

If you delete `CDKToolkit`, you must bootstrap CDK again before redeploying `HotelBaseInfraStack`.

If CDK bootstrap fails with `AWS::EarlyValidation::ResourceExistenceCheck`, check for orphaned bootstrap resources from a previous failed bootstrap. In this account, the most likely conflict is the default bootstrap bucket:

```bash
bucket="cdk-hnb659fds-assets-$AWS_ACCOUNT_ID-$AWS_REGION"

# Delete all object versions
aws s3api list-object-versions \
  --bucket "$bucket" \
  --query 'Versions[].[Key,VersionId]' \
  --output text \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" | while read -r key version_id; do
    [ -n "$key" ] && aws s3api delete-object \
      --bucket "$bucket" \
      --key "$key" \
      --version-id "$version_id" \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION"
  done

# Delete all delete markers
aws s3api list-object-versions \
  --bucket "$bucket" \
  --query 'DeleteMarkers[].[Key,VersionId]' \
  --output text \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" | while read -r key version_id; do
    [ -n "$key" ] && aws s3api delete-object \
      --bucket "$bucket" \
      --key "$key" \
      --version-id "$version_id" \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION"
  done

# Remove the now-empty bucket
aws s3 rb s3://$bucket \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION"

# If a failed bootstrap left CDKToolkit behind, delete it too
aws cloudformation delete-stack \
  --stack-name CDKToolkit \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

aws cloudformation wait stack-delete-complete \
  --stack-name CDKToolkit \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true
```

Then retry bootstrap.

## Rebuild the Demo From Scratch

This is the recommended clean restart sequence.

### 1. Re-export the AWS environment

```bash
export AWS_PROFILE=personal
export AWS_REGION=us-west-2
export AWS_SDK_LOAD_CONFIG=1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile "$AWS_PROFILE")
export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
export CDK_DEFAULT_REGION=$AWS_REGION
export GITHUB_REPO=cyotee/modern-cicd-with-github-and-aws-codepipeline
```

### 2. Re-bootstrap CDK if needed

Only do this if `CDKToolkit` was deleted:

```bash
cd infrastructure
npm install
eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
./node_modules/.bin/cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
cd ..
```

### 3. Rebuild sequence summary

After teardown, rebuild in this order:

1. Recreate `HotelBaseInfraStack`
2. Rebuild and deploy the backend SAM stack `hotel-backend-dev`
3. Publish `/hotelapp/api/url` to SSM
4. Rebuild and upload the frontend to S3 and invalidate CloudFront
5. Recreate `hotel-frontend-pipeline`

### 4. Known failure recovery rules

Use these rules during a restart:

- If CDK cannot find credentials, run `eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"` before `npx cdk ...`
- If the backend stack is in `ROLLBACK_COMPLETE`, delete it before redeploying
- The backend deploy must use the fixed `backend/template.yaml`, which no longer sets the reserved Lambda variable `AWS_REGION`
- Use explicit `ParameterKey=...,ParameterValue=...` syntax in `sam deploy` so `HotelName` remains `AWS Hotel`

## Step 1: Create an AWS CodeConnections Link to GitHub

Create the connection:

```bash
aws codeconnections create-connection \
  --provider-type GitHub \
  --connection-name hotel-app-github \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Then finish the authorization in the AWS Console:

- Open AWS Console
- Go to Developer Tools > Connections
- Open the new connection
- Choose `Update pending connection`
- Complete the GitHub authorization flow

Capture the connection ARN:

```bash
export GITHUB_CONNECTION_ARN=$(aws codeconnections list-connections \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --query "Connections[?ConnectionName=='hotel-app-github'].ConnectionArn | [0]" \
  --output text)
```

Verify it:

```bash
echo "$GITHUB_CONNECTION_ARN"
```

## Step 2: Deploy Base Infrastructure with CDK

This creates the S3 bucket, CloudFront distribution, artifact bucket, and IAM roles used by the frontend deployment flow.

```bash
cd infrastructure
npm install
eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
./node_modules/.bin/cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
./node_modules/.bin/cdk deploy HotelBaseInfraStack --require-approval never
cd ..
```

The deprecation warnings from CDK during bootstrap are not the blocker. The real bootstrap failure is credential loading. If bootstrap still fails, rerun these two checks first:

```bash
AWS_PAGER='' AWS_PROFILE="$AWS_PROFILE" aws sts get-caller-identity --no-cli-pager
AWS_PAGER='' AWS_PROFILE="$AWS_PROFILE" aws configure list --no-cli-pager
```

If those succeed but CDK still fails, rerun the credential export and try again:

```bash
eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
./node_modules/.bin/cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
```

Capture the key outputs:

```bash
export FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name HotelBaseInfraStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue | [0]" \
  --output text \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE")

export CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name HotelBaseInfraStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue | [0]" \
  --output text \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE")

export CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name HotelBaseInfraStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue | [0]" \
  --output text \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE")
```

Verify them:

```bash
echo "$FRONTEND_BUCKET"
echo "$CLOUDFRONT_DISTRIBUTION_ID"
echo "$CLOUDFRONT_URL"
```

## Step 3: Deploy the Backend with SAM

The working backend deployment path is `backend/template.yaml`.

```bash
cd backend
npm ci
npm run build
sam build --template-file template.yaml --profile "$AWS_PROFILE" --region "$AWS_REGION"

# If a previous failed deploy left the stack in ROLLBACK_COMPLETE,
# delete it before retrying deployment.
aws cloudformation delete-stack \
  --stack-name hotel-backend-dev \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

aws cloudformation wait stack-delete-complete \
  --stack-name hotel-backend-dev \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" || true

sam deploy \
  --template-file template.yaml \
  --stack-name hotel-backend-dev \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --parameter-overrides \
    ParameterKey=HotelName,ParameterValue='AWS Hotel' \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=Architecture,ParameterValue=x86_64
cd ..
```

Capture the API URL:

```bash
export API_URL=$(aws cloudformation describe-stacks \
  --stack-name hotel-backend-dev \
  --query "Stacks[0].Outputs[?OutputKey=='HotelApiUrl'].OutputValue | [0]" \
  --output text \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE")
```

Verify the API:

```bash
echo "$API_URL"
curl "$API_URL/api/config"
```

## Step 4: Publish the API URL for Frontend Builds

The frontend pipeline expects the backend URL in SSM Parameter Store.

```bash
aws ssm put-parameter \
  --name /hotelapp/api/url \
  --type String \
  --value "$API_URL" \
  --overwrite \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Verify it:

```bash
aws ssm get-parameter \
  --name /hotelapp/api/url \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

## Step 5: Do the Initial Frontend Deployment

Build the frontend with the deployed API URL and publish it to the S3 bucket from the base infrastructure stack.

```bash
cd frontend
npm ci
VITE_API_URL="$API_URL" VITE_HOTEL_NAME="AWS Hotel" npm run build
cd ..

aws s3 sync frontend/dist/ s3://$FRONTEND_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"

aws s3 cp frontend/dist/index.html s3://$FRONTEND_BUCKET/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"

aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Open the frontend:

```bash
echo "$CLOUDFRONT_URL"
```

At this point you should have:

- A working backend in AWS
- A working frontend in AWS
- GitHub Actions available for CI

## Step 6: Deploy the Frontend AWS CodePipeline

This is the continuous deployment piece you can use for the demo.

Important: CodePipeline builds whatever is pushed to GitHub. It does not use your local uncommitted workspace state. Before you demo the pipeline, make sure the current local frontend fixes are committed and pushed to the repository branch that feeds `main`.

```bash
aws cloudformation deploy \
  --template-file infrastructure/frontend-pipeline.yaml \
  --stack-name hotel-frontend-pipeline \
  --parameter-overrides \
    GitHubConnectionArn=$GITHUB_CONNECTION_ARN \
    GitHubRepo=$GITHUB_REPO \
    GitHubBranch=main \
    BaseInfraStackName=HotelBaseInfraStack \
  --capabilities CAPABILITY_IAM \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Verify the pipeline exists:

```bash
aws codepipeline get-pipeline-state \
  --name hotel-frontend-pipeline \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

## What the Demo Shows

This runbook gives you a practical CI/CD story:

- GitHub Actions runs CI when you push frontend or backend changes
- AWS hosts the deployed application
- AWS CodePipeline automatically redeploys frontend changes from `main`

For this repository as it exists now, the backend pipeline path is not reliable enough for a demo. Use SAM for backend deployment and CodePipeline for frontend CD.

## Cosmetic Change for the Demo

Use a small visible frontend-only change so the deployment is easy to verify in CloudFront.

The cleanest demo change is the hotel name in the production frontend environment file. The frontend now treats an explicit `VITE_HOTEL_NAME` value as an override, so this can be changed without touching the backend.

Edit this file:

- `frontend/.env.production`

Change this line:

```dotenv
VITE_HOTEL_NAME=AWS Hotel
```

For the demo, change it to something obvious, for example:

```dotenv
VITE_HOTEL_NAME=AWS Hotel Demo
```

That is a safe, cosmetic-only change that will be visible on the deployed landing page and in the browser title.

## Demo Flow: Branch, Push, Merge, Deploy

### 1. Create a branch

```bash
git checkout -b demo/frontend-copy-update
```

### 2. Make the cosmetic change

Edit `frontend/.env.production` as shown above.

### 3. Run the frontend checks locally

```bash
cd frontend
npm run test:coverage
npm run build
cd ..
```

### 4. Commit the change

```bash
git add frontend/.env.production
git commit -m "Update frontend hotel name for AWS demo"
```

### 5. Push the branch

```bash
git push -u origin demo/frontend-copy-update
```

### 6. Demonstrate CI

Open GitHub Actions and show:

- `Frontend CI` running on the branch or pull request
- Optional: open a pull request into `main`

### 7. Merge to `main`

Merge the pull request into `main`, or push directly to `main` if this is a disposable demo repository.

This is the event that should trigger the AWS frontend pipeline, because the pipeline is configured to watch frontend path changes on the `main` branch.

### 8. Demonstrate CD

Show the AWS Console:

- CodePipeline > `hotel-frontend-pipeline`
- Watch Source, Test, Build, and Deploy stages run

Then refresh the CloudFront URL and show the new hotel name.

## Useful Verification Commands

Check the frontend pipeline:

```bash
aws codepipeline list-pipeline-executions \
  --pipeline-name hotel-frontend-pipeline \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Check the frontend hosting bucket contents:

```bash
aws s3 ls s3://$FRONTEND_BUCKET/ \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Check the backend stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name hotel-backend-dev \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --query 'Stacks[0].Outputs'
```

## Demo Talking Points

- The backend is deployed from SAM using `backend/template.yaml`.
- The frontend is hosted on S3 and CloudFront from the base infra stack.
- GitHub Actions provides CI for both frontend and backend.
- AWS CodePipeline provides continuous deployment for frontend changes from `main`.
- The hotel-name change is intentionally frontend-only so the redeploy is easy to verify without any backend release.

## Cleanup

Delete the frontend pipeline:

```bash
aws cloudformation delete-stack \
  --stack-name hotel-frontend-pipeline \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Delete the backend stack:

```bash
aws cloudformation delete-stack \
  --stack-name hotel-backend-dev \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE"
```

Delete the base infrastructure stack:

```bash
cd infrastructure
eval "$(AWS_PAGER='' aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
./node_modules/.bin/cdk destroy HotelBaseInfraStack
cd ..
```