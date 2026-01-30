# Glamo Infrastructure

This directory contains Infrastructure as Code (IaC) for the Glamo platform.

## Structure

```
infrastructure/
├── docker/              # Docker configurations
│   ├── api/
│   ├── web/
│   └── docker-compose.yml
├── kubernetes/          # Kubernetes manifests
│   ├── base/
│   └── overlays/
└── terraform/           # Terraform configurations
    ├── modules/
    └── environments/
```

## Getting Started

### Local Development with Docker

```bash
cd docker
docker-compose up -d
```

### Terraform

```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

## Services

- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **API**: NestJS backend
- **Web**: Next.js dashboard
- **Booking**: Next.js booking portal
