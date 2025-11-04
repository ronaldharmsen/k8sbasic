# Lab: Enabling Metrics and Dashboard in MicroK8s

In this lab, you'll learn how to enable the Kubernetes metrics server and dashboard in MicroK8s, and how to access and browse the dashboard UI.

## 1. Enable Metrics Server and Dashboard

MicroK8s comes with several add-ons, including the metrics server and the Kubernetes dashboard. To enable them, run:

```sh
microk8s enable metrics-server dashboard
```

This will enable both the metrics server (for resource usage metrics) and the dashboard (a web-based UI for Kubernetes).

## 2. Check Add-on Status

Verify that the add-ons are enabled:

```sh
microk8s status
```

You should see `metrics-server` and `dashboard` listed as enabled.

## 3. Access the Dashboard

To access the dashboard, run:

```sh
microk8s dashboard-proxy
```

This command will start a proxy and display a URL (usually http://<microk8s-ip>:10443) that you can open in your browser.

## 4. Get the Dashboard Token

The dashboard requires a token for login. To get the token, run:

```sh
token=$(microk8s kubectl -n kube-system get secret | grep default-token | awk '{print $1}')
microk8s kubectl -n kube-system describe secret $token
```

By the way, the `microk8s dashboard-proxy` command will also tell you what the token should be.

Copy the token value and use it to log in to the dashboard.

## 5. Browse the Dashboard

Open the dashboard URL in your browser. Paste the token when prompted. You can now browse around the dashboard to view:

- Cluster overview
- Workloads (pods, deployments, etc.)
- Namespaces
- Resource usage (CPU, memory, etc.)

Explore the different sections to get familiar with the Kubernetes dashboard and metrics.

Especially have a look in the `kube-system` namespace as that has new pods and services now. Which are the effect of the `microk8s enable ..` command. That basically is just a short/convenient way to install the dashboard.

You can have a look at the actual yaml files here (Microk8s might have some changes in RBAC, namespaces and local access)

**Kubernetes Dashboard:** [https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml](https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml)

**Metrics Server:** 
[https://raw.githubusercontent.com/kubernetes-sigs/metrics-server/master/deploy/kubernetes/metrics-server.yaml](https://raw.githubusercontent.com/kubernetes-sigs/metrics-server/master/deploy/kubernetes/metrics-server.yaml)

---

## Alternatives ##
If you don't want to install the Kubernetes dashboard, you could also install Freelens [https://github.com/freelensapp/freelens](https://github.com/freelensapp/freelens), which is a free version of the Lens application. This application gives you basically the same options as the dashboard, but it is running on your machine instead of running as a service inside your cluster.

Other options might be things like Portainer and of course you could find multiple other dashboard like management systems that can run as application inside kubernetes.