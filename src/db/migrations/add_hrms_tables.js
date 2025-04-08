import pool from "../../config/db.js";

const addHRMSTables = async () => {
  try {
    // Check if any of the new tables already exist
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leave_types'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log("✅ HRMS tables already exist.");
      return;
    }
    
    // Start transaction
    await pool.query("BEGIN");
    
    // Create Leave Management tables
    await pool.query(`
      CREATE TABLE leave_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        default_days INTEGER DEFAULT 0,
        is_paid BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE leave_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INTEGER REFERENCES leave_types(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days DECIMAL(5,2) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approval_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE leave_balances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INTEGER REFERENCES leave_types(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        total_days INTEGER NOT NULL,
        used_days INTEGER DEFAULT 0,
        remaining_days INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, leave_type_id, year)
      )
    `);
    
    console.log("✅ Created Leave Management tables successfully.");
    
    // Create Payroll tables
    await pool.query(`
      CREATE TABLE payroll_components (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL,
        is_taxable BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE employee_payroll_components (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES payroll_components(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        is_percentage BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, component_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE payroll_periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE payroll_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        period_id INTEGER REFERENCES payroll_periods(id) ON DELETE CASCADE,
        basic_salary DECIMAL(10,2) NOT NULL,
        gross_salary DECIMAL(10,2) NOT NULL,
        net_salary DECIMAL(10,2) NOT NULL,
        total_earnings DECIMAL(10,2) NOT NULL,
        total_deductions DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, period_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE payroll_component_details (
        id SERIAL PRIMARY KEY,
        payroll_record_id INTEGER REFERENCES payroll_records(id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES payroll_components(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Created Payroll tables successfully.");
    
    // Create Performance Management tables
    await pool.query(`
      CREATE TABLE performance_cycles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE performance_goals (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES performance_cycles(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_value DECIMAL(10,2),
        achieved_value DECIMAL(10,2),
        weight DECIMAL(5,2) DEFAULT 1.0,
        status VARCHAR(20) DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES performance_cycles(id) ON DELETE CASCADE,
        review_date DATE NOT NULL,
        overall_rating DECIMAL(3,2),
        strengths TEXT,
        areas_of_improvement TEXT,
        comments TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledgment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE performance_criteria (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        weight DECIMAL(5,2) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE performance_review_ratings (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES performance_reviews(id) ON DELETE CASCADE,
        criteria_id INTEGER REFERENCES performance_criteria(id) ON DELETE CASCADE,
        rating DECIMAL(3,2) NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Created Performance Management tables successfully.");
    
    // Create Recruitment & Onboarding tables
    await pool.query(`
      CREATE TABLE job_openings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        department VARCHAR(100),
        description TEXT,
        requirements TEXT,
        responsibilities TEXT,
        salary_range VARCHAR(100),
        location VARCHAR(100),
        employment_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'open',
        posted_date DATE NOT NULL,
        closing_date DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE job_applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES job_openings(id) ON DELETE CASCADE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        resume_url TEXT,
        cover_letter TEXT,
        status VARCHAR(20) DEFAULT 'new',
        current_stage VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE interview_rounds (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES job_applications(id) ON DELETE CASCADE,
        round_name VARCHAR(100) NOT NULL,
        interview_date TIMESTAMP,
        interviewer_id INTEGER REFERENCES users(id),
        feedback TEXT,
        rating DECIMAL(3,2),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE onboarding_tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        assigned_to INTEGER REFERENCES users(id),
        due_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE employee_onboarding (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        application_id INTEGER REFERENCES job_applications(id),
        start_date DATE NOT NULL,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE onboarding_task_assignments (
        id SERIAL PRIMARY KEY,
        onboarding_id INTEGER REFERENCES employee_onboarding(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id),
        due_date DATE,
        completed_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Created Recruitment & Onboarding tables successfully.");
    
    // Create Training & Development tables
    await pool.query(`
      CREATE TABLE training_programs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        provider VARCHAR(100),
        duration VARCHAR(50),
        cost DECIMAL(10,2),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE training_sessions (
        id SERIAL PRIMARY KEY,
        program_id INTEGER REFERENCES training_programs(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        trainer VARCHAR(100),
        location VARCHAR(100),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE employee_training_enrollments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES training_programs(id) ON DELETE CASCADE,
        enrollment_date DATE NOT NULL,
        completion_date DATE,
        status VARCHAR(20) DEFAULT 'enrolled',
        feedback TEXT,
        rating DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, program_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE training_materials (
        id SERIAL PRIMARY KEY,
        program_id INTEGER REFERENCES training_programs(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE employee_skills (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
        proficiency_level VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, skill_id)
      )
    `);
    
    console.log("✅ Created Training & Development tables successfully.");
    
    // Create Document Management tables
    await pool.query(`
      CREATE TABLE document_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        category_id INTEGER REFERENCES document_categories(id) ON DELETE SET NULL,
        uploaded_by INTEGER REFERENCES users(id),
        is_public BOOLEAN DEFAULT false,
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE employee_documents (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT false,
        submission_date DATE,
        expiry_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, document_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE document_permissions (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        can_view BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(document_id, role_id)
      )
    `);
    
    console.log("✅ Created Document Management tables successfully.");
    
    // Create Benefits Administration tables
    await pool.query(`
      CREATE TABLE benefit_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        provider VARCHAR(100),
        plan_type VARCHAR(50),
        cost_per_employee DECIMAL(10,2),
        employer_contribution DECIMAL(5,2),
        employee_contribution DECIMAL(5,2),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE employee_benefits (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES benefit_plans(id) ON DELETE CASCADE,
        enrollment_date DATE NOT NULL,
        coverage_start_date DATE,
        coverage_end_date DATE,
        status VARCHAR(20) DEFAULT 'enrolled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, plan_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE benefit_claims (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES benefit_plans(id) ON DELETE CASCADE,
        claim_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        processed_by INTEGER REFERENCES users(id),
        processed_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE benefit_documents (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES benefit_claims(id) ON DELETE CASCADE,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Created Benefits Administration tables successfully.");
    
    await pool.query("COMMIT");
    console.log("✅ All HRMS tables created successfully.");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Error creating HRMS tables:", err.message);
  }
};

export default addHRMSTables; 