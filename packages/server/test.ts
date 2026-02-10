import { GenericContainer, Wait } from "testcontainers";

const qdrant = await new GenericContainer("qdrant/qdrant")
	.withExposedPorts(6333)
	.withWaitStrategy(
		Wait.forHttp("/collections", 6333).withStartupTimeout(160_000),
	)
	.start();

console.log(qdrant.getMappedPort(6333));

await qdrant.stop();

const redis = await new GenericContainer("redis:7-alpine")
	.withExposedPorts(6379)
	.withWaitStrategy(Wait.forLogMessage("* Ready to accept connections"))
	.start();

console.log(redis.getMappedPort(6379));

await qdrant.stop();
