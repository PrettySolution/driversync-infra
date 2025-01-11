import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface AppTables {
  report: Table;
}

interface DynamoDBStackProps extends StackProps {
}

export class DynamoDBStack extends Stack {
  public readonly tables: AppTables;

  constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    this.tables = {
      report: new Table(this, 'Report', {
        tableName: 'Report',
        partitionKey: { name: 'id', type: AttributeType.STRING },
        sortKey: { name: 'owner', type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        maxReadRequestUnits: 1,
        maxWriteRequestUnits: 1,
      }),
    };

  }
}