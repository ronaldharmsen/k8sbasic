# Keycloak Authentication Lab for Kubernetes

This lab demonstrates how to deploy Keycloak in Kubernetes and configure it as an OIDC provider for authenticating users with Kubernetes (kubectl).


## Lab Overview
- Deploy Keycloak in Kubernetes
- Configure Keycloak for OIDC
- Set up a user and client in Keycloak
- Configure Kubernetes API server for OIDC authentication
- Use kubectl with OIDC authentication


## Prerequisite: Enable MetalLB for LoadBalancer Services (MicroK8s)

If you are using MicroK8s, you need to enable MetalLB to support LoadBalancer services (required for Keycloak's service):

1. **Enable MetalLB:**
   ```sh
   microk8s enable metallb
   ```

2. **Configure an IP address range for MetalLB:**
   - Get the IP address of your VM: `multipass list`
   - When prompted, provide a range of IPs from your local network (e.g., `172.25.214.129-172.25.214.129`). Which basically is your <VM-ip>.
   - If not prompted, you can edit the config later:
     ```sh
     microk8s kubectl edit configmap metallb-config -n metallb-system
     ```
   - Example config:
     ```yaml
     apiVersion: v1
     kind: ConfigMap
     metadata:
       namespace: metallb-system
       name: metallb-config
     data:
       config: |
         address-pools:
         - name: default
           protocol: layer2
           addresses:
           - 192.168.1.240-192.168.1.250
     ```

3. **Verify MetalLB is working:**
   ```sh
   kubectl get pods -n metallb-system
   ```
   All pods should be running.

You can now use LoadBalancer services in MicroK8s, and the Keycloak service will be assigned an external IP from the range you specified.

---

## 1. Deploy Keycloak in Kubernetes

### a. Create a namespace for Keycloak
```sh
kubectl create namespace keycloak
```

```sh
kubectl apply -n keycloak -f https://raw.githubusercontent.com/keycloak/keycloak-quickstarts/refs/heads/main/kubernetes/keycloak.yaml
```

Wait for Keycloak to be ready:
```sh
kubectl get pods -n keycloak
```

Enable the ingress for keycloak, best to do this inside the Microk8s VM (as it uses Linux specific commands):
```sh
export MACHINEIP=<VM-i>
wget -q -O - https://raw.githubusercontent.com/keycloak/keycloak-quickstarts/refs/heads/main/kubernetes/keycloak-ingress.yaml | sed "s/KEYCLOAK_HOST/keycloak.local/" | sudo microk8s kubectl create -n keycloak -
f -
```

### c. Access the Keycloak UI
- Get the external IP:
  ```sh
  kubectl get svc -n keycloak
  ```
- Open `https://keycloak.local` in your browser.
- Login with username: `admin`, password: `admin`

if this doesn't resolve to the local Microk8s VM, place a line in c:\windows\system32\drivers\etc\hosts
```
<VM-ip> keycloak.local
```
---

## 2. Configure Keycloak for OIDC

### a. Create a new Realm (e.g., `k8s-labs`)
### b. Create a new Client (e.g., `kubectl`)
- Client Protocol: `openid-connect`
- Access Type: `confidential`
- Valid Redirect URIs: `http://localhost/*`
- Save and note the Client Secret

### c. Create a User
- Add a user (e.g., `k8suser`), set a password, and enable the account.

---

## 3. Configure Kubernetes API Server for OIDC

> **Note:** This step requires admin access to the Kubernetes API server configuration. For local clusters (like Minikube or MicroK8s), you can pass extra args. For managed clusters, consult your provider's docs.

### For MicroK8s (including on Windows with a VM):

1. **Shell into the MicroK8s VM:**
  - If running MicroK8s on Windows (with Multipass):
    ```sh
    multipass list
    multipass shell <microk8s-vm-name>
    ```
    Replace `<microk8s-vm-name>` with the name shown in the list (often `microk8s-vm` or similar).
  - If running natively on Linux, just use your terminal.

2. **Edit the API server config:**
  ```sh
  sudo nano /var/snap/microk8s/current/args/kube-apiserver
  ```
  Add the following flags (one per line, adjust values as needed):
  ```
  --oidc-issuer-url=https://keycloak.local/realms/<your-realm-name-here>
  --oidc-client-id=kubectl
  --oidc-username-claim=preferred_username
  --oidc-groups-claim=groups
  --oidc-ca-file=/var/snap/microk8s/current/certs/ca.crt
  ```

3. **Restart MicroK8s to apply changes:**
  ```sh
  microk8s stop
  microk8s start
  ```

4. **Verify the API server is running with the new flags:**
  ```sh
  ps aux | grep kube-apiserver
  ```

You can now proceed with OIDC authentication as described in the next steps.

---

## 4. Configure kubectl for OIDC

Install `kubelogin` (https://github.com/int128/kubelogin) for OIDC authentication.

```sh
kubectl oidc-login setup --oidc-issuer-url=https://keycloak.local/realms/<your-realm> --oidc-client-id=kubectl --oidc-client-secret=<secret-created-in-keycloak> --insecure-skip-tls-verify
```

This will create the default settings for you and show you how to set the user.
Check and replace the info in the script below.

Update your kubeconfig:
```sh
kubectl config set-credentials oidc 
  --exec-api-version=client.authentication.k8s.io/v1 \
  --exec-interactive-mode=Never \
  --exec-command=kubectl \
  --exec-arg=oidc-login \
  --exec-arg=get-token \
  --exec-arg="--oidc-issuer-url=https://keycloak.local/realms/<your-realm>" \
  --exec-arg="--oidc-client-id=kubectl" \
  --exec-arg="--oidc-client-secret=<secret-created-in-keycloak>" \
  --exec-arg="--insecure-skip-tls-verify=true"

kubectl config set-context oidc-context \
  --cluster=<CLUSTER-NAME> \
  --user=oidc-user

kubectl config use-context oidc-context
```

You will be prompted to authenticate via Keycloak.

---

## 5. Test Authentication

Try running:
```sh
kubectl get pods
```
You should be authenticated as your Keycloak user.

---

## References
- https://www.keycloak.org/docs/latest/server_admin/#oidc
- https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens
- https://github.com/int128/kubelogin
