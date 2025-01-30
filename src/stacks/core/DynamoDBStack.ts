import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends StackProps {
}

interface Tables {
  BASE_TABLE_PARAMETER_NAME: string;
}
export const TABLES: Tables = {
  BASE_TABLE_PARAMETER_NAME: '/core/DynamoDbStack/Tables/Base',
};

export class DynamoDBStack extends Stack {

  constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    const base = new Table(this, 'Base', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // pointInTimeRecovery: true,
      maxReadRequestUnits: 1,
      maxWriteRequestUnits: 1,
    });
    base.addGlobalSecondaryIndex({ indexName: 'gsi1pk-sk-index', partitionKey: { name: 'gsi1pk', type: AttributeType.STRING } });

    new StringParameter(this, 'baseTable', {
      parameterName: TABLES.BASE_TABLE_PARAMETER_NAME,
      stringValue: base.tableName,
    });

  }
}