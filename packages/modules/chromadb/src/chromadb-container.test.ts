import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { ChromaDBContainer, StartedChromaDbContainer } from "./chromadb-container";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

describe("RedisContainer", () => {
  jest.setTimeout(240_000);

  // startContainer {
  it("should connect", async () => {
    const container = await new ChromaDBContainer().start();
    const client = await connectTo(container);
    expect(await client.heartbeat()).toBeDefined();
    // Do something with the client
    await container.stop();
  });
  // }

  // createCollection {
  it("should create collection and get data", async () => {
    const container = await new ChromaDBContainer().start();
    const client = await connectTo(container);
    const collection = await client.createCollection({ name: "test", metadata: { "hnsw:space": "cosine" } });
    expect(collection.name).toBe("test");
    expect(collection.metadata).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(collection.metadata["hnsw:space"]).toBe("cosine");
    await collection.add({ ids: ["1"], embeddings: [[1, 2, 3]], documents: ["my doc"], metadatas: [{ key: "value" }] });
    const getResults = await collection.get({ ids: ["1"] });
    expect(getResults.ids[0]).toBe("1");
    expect(getResults.documents[0]).toStrictEqual("my doc");
    expect(getResults.metadatas).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(getResults.metadatas[0].key).toStrictEqual("value");
    await container.stop();
  });
  // }

  // queryCollection {
  it("should create collection and query", async () => {
    const container = await new ChromaDBContainer("chromadb/chroma:0.4.24").start();
    const client = await connectTo(container);
    const embedder = new OpenAIEmbeddingFunction({
      openai_api_key: "sk-xxxx",
      openai_model: "text-embedding-3-small"
    });
    const collection = await client.createCollection({
      name: "test",
      metadata: { "hnsw:space": "cosine" },
      embeddingFunction: embedder,
    });
    const { default: openai } = await import("openai");
    expect(collection.name).toBe("test");
    console.log("Collection created");
    embedder.generate(["test"]);
    try{
    await collection.add({
      ids: ["1", "2"],
      documents: [
        "This is a document about dogs. Dogs are awesome.",
        "This is a document about cats. Cats are awesome.",
      ],
    });
  }catch(e){
    console.log(e);
    }
    console.log("Added documents");
    const results = await collection.query({ queryTexts: ["Tell me about dogs"], nResults: 1 });
    expect(results).toBeDefined();
    expect(results.ids[0]).toBe(1);
    expect(results.ids[0][0]).toBe("1");
    await container.stop();
  });
  // }

  // persistentData {
  it("should reconnect with volume and persistence data", async () => {
    const sourcePath = fs.mkdtempSync(path.join(os.tmpdir(), "chroma-"));
    const container = await new ChromaDBContainer().withPersistence(sourcePath).start();
    const client = await connectTo(container);
    const collection = await client.createCollection({ name: "test", metadata: { "hnsw:space": "cosine" } });
    expect(collection.name).toBe("test");
    expect(collection.metadata).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(collection.metadata["hnsw:space"]).toBe("cosine");
    await collection.add({ ids: ["1"], embeddings: [[1, 2, 3]], documents: ["my doc"] });
    const getResults = await collection.get({ ids: ["1"] });
    expect(getResults.ids[0]).toBe("1");
    expect(getResults.documents[0]).toStrictEqual("my doc");
    await container.stop();
    try {
      fs.rmSync(sourcePath, { force: true, recursive: true });
    } catch (e) {
      //Ignore clean up, when have no access on fs.
      console.log(e);
    }
  });
  // }
  // simpleConnect {
  async function connectTo(container: StartedChromaDbContainer) {
    const client = new ChromaClient({
      path: container.getConnectionUrl(),
    });
    const hb = await client.heartbeat();
    expect(hb).toBeDefined();
    return client;
  }

  // }
});
