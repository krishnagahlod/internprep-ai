CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    problem_statement TEXT,
    solution_transcript TEXT,
    case_type TEXT,
    pdf_source TEXT,
    book_name TEXT,
    page_number INT
);
