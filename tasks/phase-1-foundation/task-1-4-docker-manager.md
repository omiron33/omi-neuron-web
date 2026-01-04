---
title: Docker Manager for PostgreSQL Container
status: completed
priority: 1
labels:
  - 'Phase:1-Foundation'
  - 'Type:Infrastructure'
assignees:
  - CodingAgent
depends_on:
  - task-1-1-project-setup
---

# Task 1.4: Docker Manager

## Objective
Build a DockerManager class that handles the full lifecycle of the PostgreSQL container with pgvector extension, including port configuration, health checks, and connection management.

## Requirements

### 1. DockerManager Class (`src/storage/docker-manager.ts`)

```typescript
interface DockerConfig {
  repoName: string;
  port: number;
  containerName?: string;
  image?: string;
  user?: string;
  password?: string;
  database?: string;
  memoryLimit?: string;
}

class DockerManager {
  constructor(config: DockerConfig);
  
  // Container lifecycle
  async start(options?: StartOptions): Promise<void>;
  async stop(options?: StopOptions): Promise<void>;
  async ensureRunning(options?: EnsureOptions): Promise<void>;
  
  // Status
  async isRunning(): Promise<boolean>;
  async healthCheck(): Promise<HealthCheckResult>;
  async getStats(): Promise<ContainerStats>;
  
  // Connection
  async getConnectionString(): Promise<string>;
  
  // Utilities
  async getLogs(options?: LogOptions): Promise<string>;
  async execSql(sql: string): Promise<string>;
  async updatePort(newPort: number): Promise<void>;
}
```

### 2. Container Start Logic
- [ ] Check if Docker is available
- [ ] Generate docker-compose config from template
- [ ] Check for port conflicts
- [ ] Start container with `docker-compose up -d`
- [ ] Wait for database readiness
- [ ] Return connection info

### 3. Container Stop Logic
- [ ] Graceful shutdown with timeout
- [ ] Optional volume cleanup
- [ ] Handle container not found

### 4. Health Check
- [ ] Check container status
- [ ] Test database connection
- [ ] Return detailed status object

### 5. Port Conflict Detection
- [ ] Scan common ports (5432, 5433, 5434, etc.)
- [ ] Identify what's using conflicting ports
- [ ] Suggest available alternatives

### 6. Docker Compose Template (`docker/docker-compose.template.yml`)

```yaml
version: '3.8'

services:
  pg-{{REPO_NAME}}:
    image: pgvector/pgvector:pg16
    container_name: pg-{{REPO_NAME}}
    restart: unless-stopped
    environment:
      POSTGRES_USER: {{DB_USER}}
      POSTGRES_PASSWORD: {{DB_PASSWORD}}
      POSTGRES_DB: {{DB_NAME}}
    ports:
      - "{{DB_PORT}}:5432"
    volumes:
      - {{VOLUME_NAME}}:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U {{DB_USER}} -d {{DB_NAME}}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: {{MEMORY_LIMIT}}

volumes:
  {{VOLUME_NAME}}:
    name: {{REPO_NAME}}_neuron_data
```

## Deliverables
- [ ] `src/storage/docker-manager.ts`
- [ ] `docker/docker-compose.template.yml`
- [ ] Port conflict detection utility
- [ ] Health check implementation
- [ ] Template rendering utility

## Acceptance Criteria
- Docker container starts successfully
- Health check returns accurate status
- Port conflicts detected and reported
- Connection string generated correctly
- Container stops gracefully
- Works on macOS, Linux, Windows (Docker Desktop)

## Error Handling
- Docker not installed → Clear error message with install instructions
- Port in use → Suggest alternatives
- Container fails to start → Return docker logs
- Database not ready → Retry with backoff

## Notes
- Use child_process for docker commands
- Parse docker inspect JSON for status
- Support both docker and docker-compose commands
- Template uses mustache-style placeholders

