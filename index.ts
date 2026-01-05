import { generateEmbeddings } from "./ai/engine";
import { generateCanonicalCourseDescriptor } from "./ai/tasks/courseClarification";

const embeddings = {
	pythonAutomation: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Python Automation",
			description:
				"Learn how to use Python to automate various tasks such as file handling, web scraping, and more.",
			topics: ["Python", "Automation", "Scripting"],
		}),
	),
	webDevelopment: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Web Development",
			description:
				"A comprehensive course on building modern web applications using HTML, CSS, JavaScript, and popular frameworks.",
			topics: ["HTML", "CSS", "JavaScript", "Web Frameworks"],
		}),
	),
	dataScience: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Data Science",
			description:
				"An in-depth course on data analysis, visualization, and machine learning using Python libraries such as Pandas, Matplotlib, and Scikit-learn.",
			topics: ["Data Analysis", "Machine Learning", "Python", "Visualization"],
		}),
	),
	networkingBasics: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Networking Basics",
			description:
				"Learn the fundamentals of computer networking, including protocols, architectures, and security.",
			topics: ["Networking", "Protocols", "Security", "Computer Networks"],
		}),
	),
	networkingAdvanced: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Advanced Networking",
			description:
				"Explore advanced topics in computer networking, including network design, optimization, and emerging technologies.",
			topics: [
				"Network Design",
				"Optimization",
				"Emerging Technologies",
				"Advanced Networking",
			],
		}),
	),
	artificialIntelligenceOverview: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Artificial Intelligence Overview",
			description:
				"A comprehensive course on artificial intelligence concepts, techniques, and applications using Python.",
			topics: ["AI", "Machine Learning", "Neural Networks", "Python"],
		}),
	),
	artificialIntelligenceTheory: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Artificial Intelligence Theory",
			description:
				"An in-depth exploration of the theoretical foundations of artificial intelligence, including algorithms, complexity, and ethical considerations.",
			topics: ["AI Theory", "Algorithms", "Complexity", "Ethics"],
		}),
	),
	zeroKnowledgeProofs: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Zero Knowledge Proofs",
			description:
				"Learn the principles and applications of zero knowledge proofs in cryptography and secure communications.",
			topics: [
				"Cryptography",
				"Zero Knowledge Proofs",
				"Security",
				"Mathematics",
			],
		}),
	),
	graphTheory: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Graph Theory",
			description:
				"An introduction to graph theory, covering fundamental concepts, algorithms, and applications in computer science and mathematics.",
			topics: ["Graph Theory", "Algorithms", "Computer Science", "Mathematics"],
		}),
	),
	basketballRefereeingBasics: await generateEmbeddings(
		generateCanonicalCourseDescriptor({
			name: "Basketball Refereeing Basics",
			description:
				"Learn the fundamental rules and techniques of basketball refereeing, including positioning, signaling, and game management.",
			topics: ["Basketball", "Refereeing", "Sports Management", "Rules"],
		}),
	),
};

const search = generateCanonicalCourseDescriptor({
	name: "Strip search surveillance automation in police stations",
	description:
		"Learn how to automate the surveillance and monitoring of strip searches in police stations using advanced technologies and ethical considerations.",
	topics: ["Automation", "Surveillance", "Ethics", "Police Procedures"],
});

const searchEmbedding = await generateEmbeddings(search);

function cosineSimilarity(a: number[], b: number[]) {
	const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}

const similarities: Record<string, number> = {};
for (const [key, embedding] of Object.entries(embeddings)) {
	if (embedding) {
		similarities[key] = cosineSimilarity(searchEmbedding, embedding);
	}
}

console.log(
	"Similarities:\n",
	Object.entries(similarities)
		.sort((a, b) => b[1] - a[1])
		.map(([key, value]) => `${key}: ${value.toFixed(4)}`)
		.join("\n"),
);
