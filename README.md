Lambda Cold Start & Cost Monitoring SaaS
A multi-tenant SaaS platform built on AWS that allows users to monitor AWS Lambda cold starts and calculate their associated costs in near real-time.

Architecture Diagram
This diagram illustrates the two primary data flows in the system:

Data Ingestion Flow: How cold start data is captured from a customer's Lambda and stored in our system.

User Interaction & Data Retrieval Flow: How an authenticated user accesses their dashboard to view the data.

graph TD
    subgraph "Customer AWS Account"
        CustomerLambda["Customer's Lambda (Instrumented)"]
    end

    subgraph "SaaS AWS Account"
        subgraph "A. Data Ingestion & Processing"
            CWLogs["CloudWatch Logs"]
            SubscriptionFilter["CloudWatch Subscription Filter<br/>(Filters for 'ColdStartReport')"]
            ProcessingLambda["Processing Lambda<br/>(Calculates Cost)"]
            DynamoDB[(DynamoDB Table<br/>PK: tenantId<br/>SK: timestamp#functionName)]
        end

        subgraph "B. User Authentication"
            CognitoUserPool["Cognito User Pool<br/>(Handles Sign-in)"]
            CognitoIdentityPool["Cognito Identity Pool<br/>(Exchanges Token for IAM Credentials)"]
            IAMRole["IAM Role for Authenticated Users<br/>(Grants API Invoke Permission)"]
        end

        subgraph "C. API & Frontend"
            User["SaaS User"]
            Browser["Browser<br/>(Next.js & React App)"]
            APIGateway["API Gateway (HTTP API)<br/>Authorization: AWS_IAM"]
            ApiHandlerLambda["API Handler Lambda<br/>(Fetches data from DynamoDB)"]
        end
    end

    %% Data Ingestion Flow
    CustomerLambda -- "1. Writes JSON log on cold start" --> CWLogs
    CWLogs --> SubscriptionFilter
    SubscriptionFilter -- "2. Forwards matching log event" --> ProcessingLambda
    ProcessingLambda -- "3. Writes processed data with cost" --> DynamoDB

    %% User Interaction & Data Retrieval Flow
    User -- "1. Signs In" --> Browser
    Browser -- "2. Authenticates with email/password" --> CognitoUserPool
    CognitoUserPool -- "3. Returns id_token" --> Browser
    Browser -- "4. Passes id_token" --> CognitoIdentityPool
    CognitoIdentityPool -- "5. Grants Temporary IAM Credentials" --> Browser
    CognitoIdentityPool -- "Assumes Role" --> IAMRole
    Browser -- "6. Makes a SigV4 Signed API Request" --> APIGateway
    APIGateway -- "7. Authorizes via IAM & Invokes" --> ApiHandlerLambda
    ApiHandlerLambda -- "8. Queries for tenant's data" --> DynamoDB
    DynamoDB -- "9. Returns cold start records" --> ApiHandlerLambda
    ApiHandlerLambda -- "10. Returns data to client" --> APIGateway
    APIGateway -- "11. Forwards Response" --> Browser
    Browser -- "12. Renders charts on dashboard" --> User

1. Overview
This project provides a robust, scalable, and secure solution for developers and organizations to gain visibility into the performance and cost implications of AWS Lambda cold starts.

When a Lambda function is invoked after a period of inactivity, it experiences a "cold start," which adds latency to the initialization phase. While often brief, this added latency can be significant for user-facing applications. This platform captures these events in near real-time, calculates the cost of the initialization phase based on the function's memory allocation, and presents the aggregated data in a user-friendly dashboard.

The entire system is built using a serverless-first approach on AWS and is defined programmatically using the AWS CDK for reliable and repeatable deployments.

2. Architecture Deep Dive
The architecture is designed around two core principles: multi-tenancy and security. Every resource and data flow is designed to ensure a customer can only ever access their own data.

Data Ingestion Pipeline
This is an event-driven pipeline that passively listens for cold start events.

Customer's Instrumented Lambda: The customer adds a small snippet to their Lambda code. This code detects a cold start, gathers metadata (like initialization duration), and writes a single, structured JSON log to Amazon CloudWatch Logs.

CloudWatch Logs Subscription Filter: A filter is configured to automatically scan all incoming logs in the SaaS account's log group for a specific JSON pattern (e.g., { "type": "ColdStartReport" }). This is highly efficient and operates in near real-time.

Processing Lambda: When the filter finds a matching log, it immediately invokes our central ProcessingLambda. This function parses the log data, calculates the cold start cost using the initDuration and memorySize, and prepares a clean record.

Amazon DynamoDB: The processed record is stored in a DynamoDB table. We chose DynamoDB for its serverless nature, immense scalability, and consistent low-latency performance. The table uses a tenantId as the Partition Key, which is the cornerstone of our multi-tenant data isolation, ensuring queries are fast and strictly scoped to a single customer.

API, Authorization, and Frontend
This is the user-facing part of the application. The authorization model uses native AWS IAM, which provides robust, permission-based security.

Amazon Cognito (User Pools & Identity Pools): Cognito serves as the backbone of our identity system.

User Pools handle the user directory: sign-up, sign-in, and password management. When a user successfully authenticates, they receive a standard id_token.

Identity Pools act as a trust broker. The frontend exchanges the id_token for temporary, limited-privilege AWS credentials by assuming an IAM Role.

IAM Role: We define an IAM Role for authenticated users. This role has a very narrow policy attached: it only grants permission to invoke our specific API Gateway endpoint (execute-api:Invoke) and nothing else.

Amazon API Gateway (HTTP API): This provides the HTTP endpoints for our frontend. Crucially, the endpoints are configured to use AWS_IAM as the authorization method. This means API Gateway will reject any request that isn't properly signed with valid AWS credentials.

Next.js Frontend: The client application, built with Next.js and React, handles the user experience.

It uses a library like amazon-cognito-identity-js to manage the sign-in flow.

After login, it uses the AWS SDK for JavaScript to exchange the Cognito token for the temporary IAM credentials.

For every API call to our backend, it uses the AWS SDK to create a Signature Version 4 (SigV4) signature for the request. This cryptographic signature is the proof of authenticity that API Gateway validates.

It uses libraries like Recharts to render the data fetched from the backend into meaningful charts and graphs.

3. Tech Stack
Frontend: Next.js (App Router), React, TypeScript, TailwindCSS, Shadcn/UI, Recharts

Backend: AWS Lambda (Node.js/TypeScript)

Infrastructure as Code: AWS CDK (TypeScript)

Database: Amazon DynamoDB

API: Amazon API Gateway (HTTP API)

Authentication: Amazon Cognito (User Pools & Identity Pools), AWS IAM

4. Getting Started
Prerequisites
Node.js (v18 or later)

AWS Account and configured local credentials

AWS CDK CLI installed (npm install -g aws-cdk)

1. Deploy the Backend Infrastructure
The AWS CDK will provision all the necessary cloud resources.

# Navigate to the infrastructure directory
cd infrastructure

# Install dependencies
npm install

# (If this is your first time using CDK in this region/account)
# Bootstrap the CDK environment
cdk bootstrap

# Deploy the stack
cdk deploy --outputs-file ./cdk-outputs.json

This will create all the Lambdas, the DynamoDB table, Cognito Pools, IAM Roles, and the API Gateway. The final command will create a cdk-outputs.json file containing the resource IDs you'll need for the frontend.

2. Configure and Run the Frontend
The frontend needs to know about the backend resources you just deployed.

Open the infrastructure/cdk-outputs.json file.

Create a new file in the frontend directory: frontend/.env.local.

Copy the values from cdk-outputs.json into .env.local:

# frontend/.env.local

NEXT_PUBLIC_AWS_REGION="<Your AWS Region, e.g., us-east-1>"
NEXT_PUBLIC_COGNITO_USER_POOL_ID="<Value from cdk-outputs.json>"
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID="<Value from cdk-outputs.json>"
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID="<Value from cdk-outputs.json>"
NEXT_PUBLIC_API_GATEWAY_URL="<Value from cdk-outputs.json>"

Install dependencies and run the development server:

# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the app
npm run dev

The application should now be running at http://localhost:3000.

5. Instrumenting a Customer Lambda
To send data to the platform, users must add the following logic to their Lambda functions. This example is for Node.js.

// A global flag to track if this is a warm execution environment
let isWarm = false;

// Record the time when the script is first loaded (initialization phase)
const initTime = Date.now();

exports.handler = async (event) => {
    if (!isWarm) {
        // This is a cold start
        const initDurationMs = Date.now() - initTime;

        // Log the structured report to CloudWatch
        // The 'tenantId' must be provided by the customer upon instrumentation.
        console.log(JSON.stringify({
            type: "ColdStartReport",
            tenantId: "CUSTOMER_ABC", // Replace with the actual Tenant ID
            functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            memorySizeMb: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
            initDurationMs: initDurationMs,
        }));

        // Set the flag to true for subsequent invocations in this container
        isWarm = true;
    }

    // --- Your actual Lambda logic begins here ---
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from your warm Lambda!'),
    };
    return response;
};

