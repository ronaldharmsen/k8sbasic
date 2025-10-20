### Scaling

Sometimes running one instance of a container is not enough to handle all the requests coming in in a timely manner.

Luckily Kubernetes allows us to spin up more instances when we need to.

To work with scaling we are going to change something to the application we build previously in the chapter about [Ingress](../ingress/README.md)

Open `server.js` and change `app.get('/' ... )` to the following:
```
app.get('/', (req, res) => {
  const app = `${process.env.APPNAME}`;
  const instance = `${process.env.HOSTNAME}`;
  res.send(`<html><head><style>body { background-color: ${process.env.COLOR}</style></head><body><h3>APP: ${app}</h3><h4>${instance}</h4></body></html>\n`);
});
```

Now build a new image version with `docker build . -t webapp:1.0.1` followed by publishing to minikube with `minikube image load webapp:1.0.1`

If you still have the ingress and containers running from the previous lab, you can upgrade the containers to run the new application version. Otherwise run the deployment and ingress.yaml again.

Upgrade with the following commands:
```
kubectl set image -n default deployment/demo-app-1 demo-app-1=webapp:1.0.1
kubectl set image -n default deployment/demo-app-2 demo-app-2=webapp:1.0.1
```

`kubectl scale --replicas=3 -n default deployment/demo-app-1`

Inspect with
```
kubectl get deployment/demo-app-1 -n default
kubectl get pods -n default
```

If you open `http://localhost/app1` in the browser now and refresh the page, you should see responses from the 3 different instances of the application. (remember to open the minikube tunnel first!)



