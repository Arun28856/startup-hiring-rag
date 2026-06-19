from langchain_text_splitters import MarkdownHeaderTextSplitter

with open("data/startup_hiring_salary_data.md", "r", encoding="utf-8") as f:
    md_content = f.read()

headers_to_split_on = [
    ("#", "role_category"),
    ("##", "role_title"),
    ("###", "sub_section")
]

splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

chunks = splitter.split_text(md_content)

# Each chunk now carries header metadata automatically
for chunk in chunks[:2]:
    print(chunk.metadata)  # {'role_category': 'Engineering', 'role_title': 'Presales Engineer'}
    print(chunk.page_content[:100])


from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)

test = embeddings.embed_query("What is the salary for an AI engineer in Bangalore?")
print(f"\n>>> Embedding dimension: {len(test)}\n", flush=True)

from langchain_community.vectorstores import Chroma

# This creates a local folder called "chroma_db" — persists across runs
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",
    collection_name="startup_hiring"
)

print("Vector store saved locally.")