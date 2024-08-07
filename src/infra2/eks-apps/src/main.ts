import {Construct} from 'constructs';
import {App, Chart, ChartProps} from 'cdk8s';
import * as kplus from 'cdk8s-plus-27';

export interface SimpleWebApiChartProps extends ChartProps {
  image: string;
  args?: string[];
  portNumber: number;
  healthcheckPath?: string;
  envVariables?: {
    [name: string]: kplus.EnvValue;
  };
}
export default class SimpleWebApiChart extends Chart {
  constructor(
    scope: Construct,
    id: string,
    props: SimpleWebApiChartProps = {
      image: 'public.ecr.aws/ecs-sample-image/amazon-ecs-sample:latest',
      portNumber: 80,
    }
  ) {
    super(scope, id, props);

    const frontendApp = new kplus.Deployment(this, 'web-api', {
      containers: [
        {
          image: props.image,
          args: props.args ?? [],
          portNumber: props.portNumber,
          envVariables: props.envVariables ?? undefined,
        },
      ],
    });

    const frontendServices = frontendApp.exposeViaService({
      ports: [
        {
          port: props.portNumber,
        },
      ],
      serviceType: kplus.ServiceType.CLUSTER_IP,
    });

    const ingress = new kplus.Ingress(this, 'ingress');
    ingress.addRule(`/api/${id}`, kplus.IngressBackend.fromService(frontendServices));
    ingress.metadata.addAnnotation('kubernetes.io/ingress.class', 'alb');
    ingress.metadata.addAnnotation('alb.ingress.kubernetes.io/scheme', 'internet-facing');
    ingress.metadata.addAnnotation('alb.ingress.kubernetes.io/listen-ports', '[{"HTTP": 80}]');
    ingress.metadata.addAnnotation('alb.ingress.kubernetes.io/healthcheck-path', props.healthcheckPath ?? '/');
    ingress.metadata.addAnnotation('alb.ingress.kubernetes.io/target-type', 'ip');
  }
}

const app = new App();

const SIMPLE_API_CONTAINER_IMG = process.env.SIMPLE_API_CONTAINER_IMG ?? '';
new SimpleWebApiChart(app, 'app1', {
  image: SIMPLE_API_CONTAINER_IMG,
  portNumber: 8080,
  healthcheckPath: '/healthz',
  envVariables: {
    ASPNETCORE_ENVIRONMENT: kplus.EnvValue.fromValue('Development'),
  },
});

app.synth();
