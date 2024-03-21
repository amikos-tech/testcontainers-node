import { AbstractStartedContainer, GenericContainer, StartedTestContainer, Wait } from "testcontainers";

const CHROMA_PORT = 8000;

export class ChromaDBContainer extends GenericContainer {
  private persistenceVolume? = "";

  constructor(image = "chromadb/chroma:latest") {
    super(image);
    this.withExposedPorts(CHROMA_PORT)
      .withStartupTimeout(120_000)
      .withWaitStrategy(
        Wait.forAll([
          Wait.forLogMessage(/Application startup complete/),
          Wait.forHttp("/api/v1/heartbeat", CHROMA_PORT)
        ])
      );
  }

  public withPersistence(sourcePath: string): this {
    this.persistenceVolume = sourcePath;
    return this;
  }

  public override async start(): Promise<StartedChromaDbContainer> {
    if (this.persistenceVolume) {
      this.withBindMounts([{ mode: "rw", source: this.persistenceVolume, target: "/chroma/chroma" }]);
    }
    return new StartedChromaDbContainer(await super.start());
  }
}

export class StartedChromaDbContainer extends AbstractStartedContainer {
  constructor(startedTestContainer: StartedTestContainer) {
    super(startedTestContainer);
  }

  public getPort(): number {
    return this.getMappedPort(CHROMA_PORT);
  }

  public getConnectionUrl(): string {
    return `http://${this.getHost()}:${this.getPort()}`;
  }
}
