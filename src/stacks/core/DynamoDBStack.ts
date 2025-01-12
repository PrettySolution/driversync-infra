import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends StackProps {
}

interface Tables {
  REPORT_TABLE_PARAMETER_NAME: string;
}
export const TABLES: Tables = {
  REPORT_TABLE_PARAMETER_NAME: '/core/DynamoDbStack/Tables/Report',
};

export class DynamoDBStack extends Stack {

  constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    const report = new Table(this, 'Report', {
      // tableName: 'Report',
      partitionKey: { name: 'ownerId', type: AttributeType.STRING },
      sortKey: { name: 'timestamp', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // pointInTimeRecovery: true,
      maxReadRequestUnits: 1,
      maxWriteRequestUnits: 1,
    });
    // report.addGlobalSecondaryIndex({ indexName: 'createdAtIndex', partitionKey: { name: 'createdAt', type: AttributeType.STRING } });

    new StringParameter(this, 'reportTable', {
      parameterName: TABLES.REPORT_TABLE_PARAMETER_NAME,
      stringValue: report.tableName,
    });

  }
}