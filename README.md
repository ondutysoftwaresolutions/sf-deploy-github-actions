# Github Actions for Salesforce Deployments
A set of Github actions that you can use to automate your deployments (SFDX) using Github as your repository for any Salesforce project.

## Available Actions

### installRequirements
This action is for download and install the SFDX CLI to use in the other steps.

#### Input Parameters

- `download_sfdx_url`: URL from where we can download the SFDX CLI package. OPTIONAL. Defaulted to *https://developer.salesforce.com/media/salesforce-cli*.
- `download_sfdx_filename`: Name of the tar file that needs to be downloaded. OPTIONAL. Defaulted to *sfdx-linux-amd64.tar.xz*.

 ### authenticate
 This actions is for the authentication with your Salesforce Org (or DevHub)

#### Input Parameters

- `app_client_id`: Consumer Key of the Salesforce Connected App. REQUIRED.
- `username`: Username of the Salesforce User. REQUIRED.
- `org_type`: Type of the SF Org. Possible values are: sandbox, production. OPTIONAL. Defaulted to *sandbox*.
- `certificate_path`: Path to the encrypted certificate. REQUIRED.
- `certificate_key`: Key used to decrypt the certificate. REQUIRED.
- `certificate_iv`: IV used to decrypt the certificate. REQUIRED.
  
 **NOTE**: When using Scratch Orgs the `org_type` needs to be **production**.
 
### scratchOrg
This containts a set of actions (create, push, runTests, delete) to use with Scratch orgs.

#### 1. create

##### Input Parameters
- `scratch_definition_path`: Path to the definition file that contains the Scratch org details. REQUIRED.

##### Output Parameters

- `scratch_org_name`: Name of the created scratch org. This is a Random name created automatically.

#### 2. push

##### Input Parameters
- `scratch_org_name`: Name of the Scratch Org to use for pushing the package. REQUIRED.

#### 3. runTests

##### Input Parameters
- `scratch_org_name`: Name of the Scratch Org to use for running the tests. REQUIRED.
- `minimum_test_coverage`: Minimum percentage of coverage needed to pass the build. OPTIONAL. Defaulted to *75*.

#### 4. delete

##### Input Parameters
- `scratch_org_name`: Name of the Scratch Org to delete. REQUIRED.

### validateOrDeploy
This is an action to do a validation of a deployment (e.g. for Production) or a deployment (e.g. for Sandboxes). 
If it's only a validation, this action will return the `job_id` to be used for a quick deployment.
This step also handles destructive changes is specified, see example 4.

#### Input Parameters
- `package_path`: Path to the manifest package (package.xml) or Destructive changes folder. REQUIRED.
- `test_level`: Choose to run or not the tests. Possible values are: RunLocalTests, NoTestRun. OPTIONAL. (Production deployments will run the tests if needed). 
- `org_type`: Type of the Salesforce Org. Possible values are: sandbox, production. OPTIONAL. Defaulted to *sandbox*.
- `wait_time`: Number of minutes to wait for the command to complete and display results to the terminal window. OPTIONAL. Defaulted to *30*.
- `deploy`: Deploy the package to the sandbox? or just validate the package?. If the `org_type` is **production** this parameter will not have an impact because for production we need to first validate and then quick deploy. OPTIONAL. Defaulted to *false*.
- `is_destructive`: Is the deployment a destructive changes deployment?. OPTIONAL. Defaulted to *false*.

#### Output Parameters
- `job_id`: Job ID to be used in the next step (Deployment). If `deploy` is true, it will return 0, otherwise it will return the Salesforce Job Id.

### quickDeployment
This action uses the `job-id` obtained in the Validation step and perform a quick deployment in the specified org.

#### Input Parameters
- `job_id`: Job Id returned by the **validateOrDeploy** step. REQUIRED.


## Examples

1. Create a Scratch org, deploy to it, run the tests and delete the Scratch org, every time we create a Pull Request to master.

```
name: Validate the Pull Request Changes

# Definition when the workflow should run
on:
  pull_request:
    branches:
      - master
    paths:
      - force-app/main/default/**

# Jobs to be executed
jobs:
  Deploy-to-Scratch-Org:
    runs-on: ubuntu-latest
    steps:
      # Checkout the code in the pull request
      - name: "Checkout source code"
        uses: actions/checkout@v2
        
      - name: 'Install Prerequisites'
        uses: engPabloMartinez/sf-deploy-github-actions/installRequirements@master

      - name: "Authenticate with DevHub"
        uses: engPabloMartinez/sf-deploy-github-actions/authenticate@master
        with:
          certificate_path: cert/server.key.enc
          certificate_key: ${{ secrets.CERTIFICATE_KEY }}
          certificate_iv: ${{ secrets.CERTIFICATE_IV }}
          app_client_id: ${{ secrets.PRODUCTION_APP_CONSUMER_KEY }}
          username: ${{ secrets.PRODUCTION_USERNAME }}
          org_type: "production"

      - name: "Create a Scratch Org"
        id: newScratchOrg
        uses: engPabloMartinez/sf-deploy-github-actions/scratchOrg/create@master
        with:
          scratch_definition_path: config/project-scratch-def.json

      - name: "Push changes to the Scratch Org"
        uses: engPabloMartinez/sf-deploy-github-actions/scratchOrg/push@master
        with:
          scratch_org_name: ${{ steps.newScratchOrg.outputs.scratch_org_name }}

      - name: "Run Tests on Scratch Org"
        uses: engPabloMartinez/sf-deploy-github-actions/scratchOrg/runTests@master
        with:
          scratch_org_name: ${{ steps.newScratchOrg.outputs.scratch_org_name }}

      - name: "Delete the Scratch Org"
        if: ${{ always() }}
        uses: engPabloMartinez/sf-deploy-github-actions/scratchOrg/delete@master
        with:
          scratch_org_name: ${{ steps.newScratchOrg.outputs.scratch_org_name }}
```

2. Deploy to a Sandbox when we push (merge) to master. It will also run the tests.

```
name: Deployment to Sandbox

# Definition when the workflow should run
on:
  push:
    branches:
      - master
    paths:
      - force-app/main/default/**

# Jobs to be executed
jobs:
  Deploy-To-Sandbox:
    runs-on: ubuntu-latest
    steps:
      # Checkout the code in the pull request
      - name: "Checkout source code"
        uses: actions/checkout@v2
        
      - name: 'Install Prerequisites'
        uses: engPabloMartinez/sf-deploy-github-actions/installRequirements@master  

      - name: "Authenticate with Sandbox"
        uses: engPabloMartinez/sf-deploy-github-actions/authenticate@master
        with:
          certificate_path: cert/server.key.enc
          certificate_key: ${{ secrets.CERTIFICATE_KEY }}
          certificate_iv: ${{ secrets.CERTIFICATE_IV }}
          app_client_id: ${{ secrets.SANDBOX_APP_CONSUMER_KEY }}
          username: ${{ secrets.SANDBOX_USERNAME }}

      - name: "Deploy the Package in Sandbox"
        uses: engPabloMartinez/sf-deploy-github-actions/validateOrDeploy@master
        with:
          package_path: manifest/package.xml
          deploy: "true"
          test_level: "RunLocalTests"
```

3. Deploy to Production when we tag a commit (tag starting with v) in master. This will validate the deployment and if it's successful it will do a quick deployment. After a successful deployment it will create a Github Release, adding the Release Notes from the commits.

```
name: Deployment to Production

# Definition when the workflow should run
on:
  push:
    tags:
      - v*
    paths:
      - force-app/main/default/**

# Jobs to be executed
jobs:
  Deploy-To-Production:
    runs-on: ubuntu-latest
    steps:
      # Checkout the code in the pull request
      - name: 'Checkout source code'
        uses: actions/checkout@v2

      - name: 'Install Prerequisites'
        uses: engPabloMartinez/sf-deploy-github-actions/installRequirements@master

      - name: 'Authenticate with Production'
        uses: engPabloMartinez/sf-deploy-github-actions/authenticate@master
        with:
          certificate_path: cert/server.key.enc
          certificate_key: ${{ secrets.CERTIFICATE_KEY }}
          certificate_iv: ${{ secrets.CERTIFICATE_IV }}
          app_client_id: ${{ secrets.PRODUCTION_APP_CONSUMER_KEY }}
          username: ${{ secrets.PRODUCTION_USERNAME }}
          org_type: 'production'

      - name: 'Validate the Package in Production Org'
        id: validatePackage
        uses: engPabloMartinez/sf-deploy-github-actions/validateOrDeploy@master
        with:
          package_path: manifest/package.xml
          test_level: 'RunLocalTests'
          deploy: 'false'
          org_type: 'production'

      - name: 'Deploy the Package to the Production Org'
        uses: engPabloMartinez/sf-deploy-github-actions/quickDeployment@master
        if: ${{ steps.validatePackage.outputs.job_id != '0' }}
        with:
          job_id: ${{ steps.validatePackage.outputs.job_id }}

  Create-Release:
    needs: [Deploy-To-Production]
    runs-on: ubuntu-latest
    steps:
      # Checkout the code in the pull request
      - name: 'Checkout source code'
        uses: actions/checkout@v2

      - name: Create Release with Notes
        uses: actions/github-script@v5
        with:
          script: |
            github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: context.ref,
              name: `Release ${context.ref}`,
              draft: false,
              prerelease: false,
              generate_release_notes: true
            })
```

4. Run destructive changes (delete metadata) to a Sandbox when a destructiveChanges.xml is commited to master.

```
name: Destructive Changes to Sandbox

# Definition when the workflow should run
on:
  push:
    branches:
      - master
    paths:
      - destructiveChanges/destructiveChanges.xml

# Jobs to be executed
jobs:
  Deploy-to-Sandbox:
    runs-on: ubuntu-latest
    steps:
      # Checkout the code in the pull request
      - name: "Checkout source code"
        uses: actions/checkout@v2
        
      - name: 'Install Prerequisites'
        uses: engPabloMartinez/sf-deploy-github-actions/installRequirements@master    

      - name: "Authenticate with Sandbox"
        uses: engPabloMartinez/sf-deploy-github-actions/authenticate@master
        with:
          certificate_path: cert/server.key.enc
          certificate_key: ${{ secrets.CERTIFICATE_KEY }}
          certificate_iv: ${{ secrets.CERTIFICATE_IV }}
          app_client_id: ${{ secrets.SANDBOX_APP_CONSUMER_KEY }}
          username: ${{ secrets.SANDBOX_USERNAME }}

      - name: "Deploy the Destructive Changes to Sandbox"
        uses: engPabloMartinez/sf-deploy-github-actions/validateOrDeploy@master
        with:
          package_path: destructiveChanges
          deploy: "true"
          is_destructive: "true"
```
