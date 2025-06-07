# @your-saas/coldstart-monitor

A small helper that logs a `ColdStartReport` object on the first invocation of your Lambda function. The report can be captured with a CloudWatch Logs subscription and processed for metrics and cost calculations.

## Installation

```bash
npm install @your-saas/coldstart-monitor
```

## Usage

Wrap your handler with `withColdStartLog` and provide the tenant ID for the function.

```ts
import { withColdStartLog } from '@your-saas/coldstart-monitor';

export const handler = withColdStartLog(async (event) => {
  // your logic here
}, { tenantId: 'YOUR_TENANT_ID' });
```

On the first execution after a cold start the wrapper logs a JSON line similar to:

```json
{"type":"ColdStartReport","tenantId":"YOUR_TENANT_ID","functionName":"my-fn","memorySizeMb":128,"initDurationMs":42}
```

## Lambda Layer

The compiled `dist` directory can also be packaged as a Lambda Layer. Place the contents under `nodejs/node_modules/@your-saas/coldstart-monitor` in a zip file and publish it as a layer. Customers can then add the layer to their functions and import the package the same way as above.
