require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Mock household data for Maria Santos
const HOUSEHOLD_DATA = {
  parent: {
    id: 'PARENT_001',
    name: 'Maria Santos',
    age: 38,
    language: 'es',
    preferredLanguage: 'Spanish',
    email: 'maria.santos@email.com',
    phone: '+1-617-555-0142',
    address: {
      street: '42 Woodrow Avenue',
      unit: '2R',
      city: 'Dorchester',
      state: 'MA',
      zip: '02124'
    },
    employment: {
      status: 'unemployed',
      lastEmployer: 'Target Corporation',
      lastPosition: 'Retail Manager',
      lastEmploymentDate: '2024-09-15',
      unemploymentBenefits: 2400,
      lastAnnualIncome: 52000
    },
    maritalStatus: 'divorced',
    divorceDate: '2024-05-01',
    rentAmount: 1800
  },
  children: [
    {
      id: 'STUDENT_001',
      name: 'Sofia Santos',
      age: 15,
      grade: 10,
      school: 'Boston Latin Academy',
      dateOfBirth: '2009-03-15'
    },
    {
      id: 'STUDENT_002',
      name: 'Miguel Santos',
      age: 12,
      grade: 7,
      school: 'Rafael Hernández K-8 School',
      dateOfBirth: '2012-08-22'
    }
  ],
  householdSize: 3,
  monthlyIncome: 2400,
  annualIncome: 28800,
  lastUpdated: '2024-11-12'
};

// Benefits program database with eligibility rules
const BENEFITS_PROGRAMS = {
  federal: [
    {
      id: 'snap',
      name: 'SNAP Food Assistance',
      nameEs: 'Asistencia de Alimentos SNAP',
      description: 'Monthly food assistance for groceries',
      descriptionEs: 'Asistencia mensual para comprar alimentos',
      agency: 'USDA',
      eligibility: {
        incomeLimit: (householdSize) => {
          const limits = { 1: 1580, 2: 2137, 3: 2694, 4: 3250, 5: 3808 };
          return limits[householdSize] || 3808 + (householdSize - 5) * 558;
        },
        requirements: ['US Citizen or Legal Resident', 'Massachusetts Resident', 'Income below 130% FPL']
      },
      calculation: (household) => {
        const maxBenefit = { 1: 291, 2: 535, 3: 766, 4: 973, 5: 1155 }[household.householdSize] || 1155;
        const netIncome = household.monthlyIncome - (household.rentAmount * 0.5);
        const benefit = Math.max(maxBenefit - (netIncome * 0.3), 23);
        return Math.round(benefit);
      },
      monthlyAmount: 740,
      annualAmount: 8880,
      processingTime: '7-30 days',
      renewalPeriod: '6 months'
    },
    {
      id: 'wic',
      name: 'WIC Nutrition Program',
      nameEs: 'Programa de Nutrición WIC',
      description: 'Nutritious foods for children under 13',
      descriptionEs: 'Alimentos nutritivos para niños menores de 13 años',
      agency: 'USDA',
      eligibility: {
        incomeLimit: (householdSize) => {
          const limits = { 1: 2430, 2: 3287, 3: 4144, 4: 5000, 5: 5857 };
          return limits[householdSize] || 5857 + (householdSize - 5) * 857;
        },
        requirements: ['Child under age 5 OR Pregnant', 'Income below 185% FPL']
      },
      calculation: (household) => {
        const eligibleChildren = household.children.filter(c => c.age < 13).length;
        return eligibleChildren * 47;
      },
      monthlyAmount: 47,
      annualAmount: 564,
      processingTime: '1-2 weeks',
      renewalPeriod: '6 months'
    },
    {
      id: 'medicaid',
      name: 'MassHealth (Medicaid)',
      nameEs: 'MassHealth (Medicaid)',
      description: 'Free health insurance for entire family',
      descriptionEs: 'Seguro médico gratuito para toda la familia',
      agency: 'MassHealth',
      eligibility: {
        incomeLimit: (householdSize) => {
          const limits = { 1: 1732, 2: 2348, 3: 2961, 4: 3575, 5: 4188 };
          return limits[householdSize] || 4188 + (householdSize - 5) * 613;
        },
        requirements: ['Massachusetts Resident', 'Income below 150% FPL']
      },
      calculation: (household) => {
        // Average family health insurance cost in MA
        return household.householdSize * 283;
      },
      monthlyAmount: 850,
      annualAmount: 10200,
      processingTime: '30-45 days',
      renewalPeriod: '12 months'
    },
    {
      id: 'section8',
      name: 'Section 8 Housing Choice Voucher',
      nameEs: 'Cupones de Vivienda Section 8',
      description: 'Rental assistance through Boston Housing Authority',
      descriptionEs: 'Asistencia de alquiler de Boston Housing Authority',
      agency: 'HUD / Boston Housing Authority',
      eligibility: {
        incomeLimit: (householdSize) => {
          // 50% AMI for Boston
          const limits = { 1: 3750, 2: 4275, 3: 4800, 4: 5325, 5: 5850 };
          return limits[householdSize] || 5850 + (householdSize - 5) * 525;
        },
        requirements: ['Income below 50% AMI', 'US Citizen or Legal Resident']
      },
      calculation: (household) => {
        const fairMarketRent = 2100; // 2BR in Boston
        const tenantPortion = household.monthlyIncome * 0.3;
        return Math.round(fairMarketRent - tenantPortion);
      },
      monthlyAmount: 900,
      annualAmount: 10800,
      processingTime: 'Waitlist: 2-5 years',
      renewalPeriod: '12 months'
    }
  ],
  state: [
    {
      id: 'tafdc',
      name: 'TAFDC Cash Assistance',
      nameEs: 'Asistencia en Efectivo TAFDC',
      description: 'Temporary cash assistance for families',
      descriptionEs: 'Asistencia temporal en efectivo para familias',
      agency: 'MA Department of Transitional Assistance',
      eligibility: {
        incomeLimit: (householdSize) => {
          return householdSize * 579;
        },
        requirements: ['Dependent child under 18', 'Income below program limits', 'Work requirements or exemption']
      },
      calculation: (household) => {
        const maxBenefit = { 1: 500, 2: 633, 3: 766, 4: 898 }[household.householdSize] || 898;
        return Math.round(maxBenefit - (household.monthlyIncome * 0.5));
      },
      monthlyAmount: 578,
      annualAmount: 6936,
      processingTime: '30-45 days',
      renewalPeriod: '6 months'
    },
    {
      id: 'fuel_assist',
      name: 'Fuel Assistance (LIHEAP)',
      nameEs: 'Asistencia de Combustible',
      description: 'Winter heating bill assistance',
      descriptionEs: 'Ayuda con facturas de calefacción en invierno',
      agency: 'MA Department of Housing and Community Development',
      eligibility: {
        incomeLimit: (householdSize) => {
          const limits = { 1: 4395, 2: 5745, 3: 7095, 4: 8445, 5: 9795 };
          return limits[householdSize] || 9795 + (householdSize - 5) * 1350;
        },
        requirements: ['Income below 60% State Median', 'Heating costs']
      },
      calculation: (household) => {
        return 1200; // Average benefit in MA
      },
      monthlyAmount: 100,
      annualAmount: 1200,
      processingTime: '4-6 weeks',
      renewalPeriod: 'Annual (Nov-Apr)'
    },
    {
      id: 'connector_care',
      name: 'ConnectorCare',
      nameEs: 'ConnectorCare',
      description: 'Subsidized health insurance marketplace',
      descriptionEs: 'Seguro médico subsidiado',
      agency: 'Massachusetts Health Connector',
      eligibility: {
        incomeLimit: (householdSize) => {
          const limits = { 1: 3960, 2: 5360, 3: 6760, 4: 8160, 5: 9560 };
          return limits[householdSize] || 9560 + (householdSize - 5) * 1400;
        },
        requirements: ['Income between 150-300% FPL', 'Not eligible for MassHealth']
      },
      calculation: (household) => {
        return 350; // Average subsidy amount
      },
      monthlyAmount: 350,
      annualAmount: 4200,
      processingTime: '2-3 weeks',
      renewalPeriod: '12 months'
    },
    {
      id: 'mrvp',
      name: 'Mass Rental Voucher Program',
      nameEs: 'Programa de Cupones de Alquiler',
      description: 'State rental assistance supplement',
      descriptionEs: 'Suplemento estatal de asistencia de alquiler',
      agency: 'MA Department of Housing and Community Development',
      eligibility: {
        incomeLimit: (householdSize) => {
          const limits = { 1: 3200, 2: 3650, 3: 4100, 4: 4550, 5: 5000 };
          return limits[householdSize] || 5000 + (householdSize - 5) * 450;
        },
        requirements: ['Income below 80% AMI', 'Massachusetts resident 1+ year']
      },
      calculation: (household) => {
        return 600; // Average voucher amount
      },
      monthlyAmount: 600,
      annualAmount: 7200,
      processingTime: 'Waitlist: 6-18 months',
      renewalPeriod: '12 months'
    }
  ],
  city: [
    {
      id: 'summer_youth',
      name: 'Boston Summer Youth Employment',
      nameEs: 'Empleos de Verano para Jóvenes',
      description: 'Paid summer employment for teens 14-18',
      descriptionEs: 'Empleo pagado de verano para adolescentes 14-18',
      agency: 'Boston Private Industry Council',
      eligibility: {
        incomeLimit: () => 999999, // No strict income limit, but priority for low-income
        requirements: ['Age 14-18', 'Boston resident', 'School enrollment']
      },
      calculation: (household) => {
        const eligibleTeens = household.children.filter(c => c.age >= 14 && c.age <= 18).length;
        return eligibleTeens * 2000; // 6 weeks at $15/hr
      },
      monthlyAmount: 0,
      annualAmount: 2000,
      processingTime: 'Apply by May 1',
      renewalPeriod: 'Annual'
    },
    {
      id: 'afterschool',
      name: 'Boston Centers for Youth & Families Programs',
      nameEs: 'Programas Después de la Escuela',
      description: 'Free after-school activities',
      descriptionEs: 'Actividades gratuitas después de la escuela',
      agency: 'Boston Centers for Youth & Families',
      eligibility: {
        incomeLimit: (householdSize) => {
          return householdSize * 2500;
        },
        requirements: ['Boston resident', 'Age 5-18']
      },
      calculation: (household) => {
        return household.children.length * 750; // Value of free programming
      },
      monthlyAmount: 125,
      annualAmount: 1500,
      processingTime: '1-2 weeks',
      renewalPeriod: 'Per season'
    }
  ],
  education: [
    {
      id: 'workforce_dev',
      name: 'Workforce Development Training',
      nameEs: 'Desarrollo Laboral',
      description: 'Job training through Boston PIC with stipend',
      descriptionEs: 'Capacitación laboral a través de Boston PIC con estipendio',
      agency: 'Boston Private Industry Council',
      eligibility: {
        incomeLimit: () => 5000,
        requirements: ['Unemployed or underemployed', 'Boston resident']
      },
      calculation: () => 500,
      monthlyAmount: 0,
      annualAmount: 500,
      processingTime: '2-4 weeks',
      renewalPeriod: 'One-time'
    },
    {
      id: 'cc_tuition',
      name: 'Community College Tuition Waiver',
      nameEs: 'Exención de Matrícula Universitaria',
      description: 'Free community college courses',
      descriptionEs: 'Cursos gratuitos en community college',
      agency: 'Massachusetts Community Colleges',
      eligibility: {
        incomeLimit: (householdSize) => {
          return householdSize * 2000;
        },
        requirements: ['Income below limits', 'Massachusetts resident']
      },
      calculation: () => 5000,
      monthlyAmount: 0,
      annualAmount: 5000,
      processingTime: 'Apply before semester start',
      renewalPeriod: 'Per semester'
    }
  ]
};

// Session storage
const sessions = new Map();

// MCP Tools
const tools = [
  {
    name: 'detect_household_changes',
    description: 'Detects changes in household circumstances that trigger benefit eligibility (unemployment, income changes, family composition changes). This is the PROACTIVE trigger that initiates the benefits scan.',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Unique identifier for the household'
        }
      },
      required: ['household_id']
    }
  },
  {
    name: 'scan_benefit_programs',
    description: 'Scans ALL available benefit programs (federal, state, city, education) and returns complete catalog. This is the comprehensive discovery step.',
    input_schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categories to scan: federal, state, city, education. Leave empty to scan all.'
        }
      }
    }
  },
  {
    name: 'calculate_eligibility',
    description: 'Determines eligibility for specific benefit programs based on household data. Returns which programs the household qualifies for and why.',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Household identifier'
        },
        program_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific program IDs to check, or empty array to check all'
        }
      },
      required: ['household_id']
    }
  },
  {
    name: 'calculate_benefit_amounts',
    description: 'Calculates exact dollar amounts for eligible benefits based on household specifics (income, size, rent, etc)',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Household identifier'
        },
        program_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Program IDs to calculate amounts for'
        }
      },
      required: ['household_id', 'program_ids']
    }
  },
  {
    name: 'get_required_documents',
    description: 'Returns list of documents needed to complete benefit applications',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Household identifier'
        },
        program_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Programs to get document requirements for'
        }
      },
      required: ['household_id', 'program_ids']
    }
  },
  {
    name: 'prefill_application',
    description: 'Prepares pre-filled application for a benefit program using stored household data',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Household identifier'
        },
        program_id: {
          type: 'string',
          description: 'Benefit program ID to prepare application for'
        }
      },
      required: ['household_id', 'program_id']
    }
  },
  {
    name: 'submit_application',
    description: 'Submits a benefit application after family review and approval',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Household identifier'
        },
        program_id: {
          type: 'string',
          description: 'Program ID to submit application for'
        },
        consent_given: {
          type: 'boolean',
          description: 'Whether family has given consent to submit'
        }
      },
      required: ['household_id', 'program_id', 'consent_given']
    }
  },
  {
    name: 'check_application_status',
    description: 'Checks status of submitted benefit applications',
    input_schema: {
      type: 'object',
      properties: {
        household_id: {
          type: 'string',
          description: 'Household identifier'
        },
        program_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Program IDs to check status for. Empty array checks all submitted applications.'
        }
      },
      required: ['household_id']
    }
  }
];

// Tool execution functions
function executeTool(toolName, toolInput) {
  switch (toolName) {
    case 'detect_household_changes':
      return {
        household_id: toolInput.household_id,
        changes_detected: [
          {
            type: 'employment_status',
            previous_value: 'employed',
            current_value: 'unemployed',
            change_date: '2024-09-15',
            trigger_scan: true
          },
          {
            type: 'monthly_income',
            previous_value: 4333,
            current_value: 2400,
            change_date: '2024-09-15',
            trigger_scan: true
          }
        ],
        scan_recommended: true,
        reason: 'Significant income reduction and employment status change detected. Household likely now eligible for additional benefits.'
      };

    case 'scan_benefit_programs':
      const categories = toolInput.categories && toolInput.categories.length > 0 
        ? toolInput.categories 
        : ['federal', 'state', 'city', 'education'];
      
      let programs = [];
      categories.forEach(cat => {
        if (BENEFITS_PROGRAMS[cat]) {
          programs = programs.concat(BENEFITS_PROGRAMS[cat]);
        }
      });

      return {
        total_programs_scanned: programs.length,
        categories_scanned: categories,
        programs: programs.map(p => ({
          id: p.id,
          name: p.name,
          nameEs: p.nameEs,
          description: p.description,
          descriptionEs: p.descriptionEs,
          agency: p.agency,
          category: Object.keys(BENEFITS_PROGRAMS).find(key => 
            BENEFITS_PROGRAMS[key].some(prog => prog.id === p.id)
          )
        }))
      };

    case 'calculate_eligibility':
      const household = HOUSEHOLD_DATA;
      const programIds = toolInput.program_ids || [];
      
      let programsToCheck = [];
      if (programIds.length === 0) {
        // Check all programs
        Object.values(BENEFITS_PROGRAMS).forEach(category => {
          programsToCheck = programsToCheck.concat(category);
        });
      } else {
        // Check specific programs
        Object.values(BENEFITS_PROGRAMS).forEach(category => {
          programsToCheck = programsToCheck.concat(
            category.filter(p => programIds.includes(p.id))
          );
        });
      }

      const eligibilityResults = programsToCheck.map(program => {
        const incomeLimit = program.eligibility.incomeLimit(household.householdSize);
        const isEligible = household.monthlyIncome <= incomeLimit;

        return {
          program_id: program.id,
          program_name: program.name,
          eligible: isEligible,
          income_limit: incomeLimit,
          household_income: household.monthlyIncome,
          margin: incomeLimit - household.monthlyIncome,
          requirements_met: program.eligibility.requirements,
          reason: isEligible 
            ? `Household income ($${household.monthlyIncome}) is below program limit ($${incomeLimit})` 
            : `Household income ($${household.monthlyIncome}) exceeds program limit ($${incomeLimit})`
        };
      });

      return {
        household_id: toolInput.household_id,
        total_programs_checked: programsToCheck.length,
        eligible_programs: eligibilityResults.filter(r => r.eligible).length,
        ineligible_programs: eligibilityResults.filter(r => !r.eligible).length,
        results: eligibilityResults
      };

    case 'calculate_benefit_amounts':
      const householdData = HOUSEHOLD_DATA;
      const programsForCalc = toolInput.program_ids.map(id => {
        let found = null;
        Object.values(BENEFITS_PROGRAMS).forEach(category => {
          const program = category.find(p => p.id === id);
          if (program) found = program;
        });
        return found;
      }).filter(p => p !== null);

      const amounts = programsForCalc.map(program => {
        const monthlyAmount = program.calculation(householdData);
        const annualAmount = program.id === 'summer_youth' || program.id === 'workforce_dev' || program.id === 'cc_tuition' || program.id === 'fuel_assist'
          ? program.annualAmount
          : monthlyAmount * 12;

        return {
          program_id: program.id,
          program_name: program.name,
          monthly_amount: monthlyAmount,
          annual_amount: annualAmount,
          processing_time: program.processingTime,
          renewal_period: program.renewalPeriod
        };
      });

      const totalMonthly = amounts.reduce((sum, a) => {
        return sum + (a.monthly_amount || 0);
      }, 0);

      const totalAnnual = amounts.reduce((sum, a) => sum + a.annual_amount, 0);

      return {
        household_id: toolInput.household_id,
        program_amounts: amounts,
        total_monthly_benefit: totalMonthly,
        total_annual_benefit: totalAnnual
      };

    case 'get_required_documents':
      const docsByProgram = {
        snap: ['Photo ID', 'Proof of address', 'Proof of income (unemployment letter)', 'Social Security cards'],
        wic: ['Photo ID', 'Proof of address', 'Child birth certificates', 'Proof of income'],
        medicaid: ['Photo ID', 'Proof of address', 'Proof of income', 'Social Security cards', 'Child birth certificates'],
        section8: ['Photo ID', 'Birth certificates', 'Social Security cards', 'Proof of income', 'Rental history', 'Credit report'],
        tafdc: ['Photo ID', 'Birth certificates', 'Social Security cards', 'Proof of income', 'Proof of address', 'School enrollment verification'],
        fuel_assist: ['Photo ID', 'Proof of address', 'Heating bills', 'Proof of income'],
        connector_care: ['Photo ID', 'Social Security cards', 'Proof of income', 'Tax returns'],
        mrvp: ['Photo ID', 'Birth certificates', 'Social Security cards', 'Proof of income', 'Rental history'],
        summer_youth: ['School enrollment verification', 'Birth certificate', 'Work permit (if under 16)'],
        afterschool: ['Child birth certificates', 'Proof of address', 'School enrollment'],
        workforce_dev: ['Photo ID', 'Social Security card', 'Proof of address', 'Resume'],
        cc_tuition: ['Photo ID', 'Social Security card', 'Tax returns', 'High school diploma/GED']
      };

      const requestedDocs = toolInput.program_ids.map(id => ({
        program_id: id,
        program_name: BENEFITS_PROGRAMS.federal.concat(
          BENEFITS_PROGRAMS.state,
          BENEFITS_PROGRAMS.city,
          BENEFITS_PROGRAMS.education
        ).find(p => p.id === id)?.name || id,
        required_documents: docsByProgram[id] || []
      }));

      // Get unique documents across all programs
      const allDocs = new Set();
      requestedDocs.forEach(rd => {
        rd.required_documents.forEach(doc => allDocs.add(doc));
      });

      return {
        household_id: toolInput.household_id,
        programs_checked: toolInput.program_ids.length,
        documents_by_program: requestedDocs,
        unique_documents_needed: Array.from(allDocs),
        total_unique_documents: allDocs.size
      };

    case 'prefill_application':
      const programData = Object.values(BENEFITS_PROGRAMS).flat().find(p => p.id === toolInput.program_id);
      
      return {
        household_id: toolInput.household_id,
        program_id: toolInput.program_id,
        program_name: programData?.name || 'Unknown Program',
        prefilled_fields: {
          applicant_name: HOUSEHOLD_DATA.parent.name,
          applicant_dob: '1986-04-12',
          address: `${HOUSEHOLD_DATA.parent.address.street}, ${HOUSEHOLD_DATA.parent.address.unit}`,
          city: HOUSEHOLD_DATA.parent.address.city,
          state: HOUSEHOLD_DATA.parent.address.state,
          zip: HOUSEHOLD_DATA.parent.address.zip,
          phone: HOUSEHOLD_DATA.parent.phone,
          email: HOUSEHOLD_DATA.parent.email,
          household_size: HOUSEHOLD_DATA.householdSize,
          monthly_income: HOUSEHOLD_DATA.monthlyIncome,
          annual_income: HOUSEHOLD_DATA.annualIncome,
          employment_status: HOUSEHOLD_DATA.parent.employment.status,
          children: HOUSEHOLD_DATA.children.map(c => ({
            name: c.name,
            dob: c.dateOfBirth,
            age: c.age,
            school: c.school
          })),
          rent_amount: HOUSEHOLD_DATA.parent.rentAmount
        },
        fields_needing_attention: [
          { field: 'signature', reason: 'Requires your signature', required: true },
          { field: 'consent_to_verify', reason: 'Please check box to consent to income verification', required: true }
        ],
        estimated_completion_time: '5 minutes',
        ready_to_review: true
      };

    case 'submit_application':
      if (!toolInput.consent_given) {
        return {
          success: false,
          error: 'Cannot submit without family consent'
        };
      }

      const program = Object.values(BENEFITS_PROGRAMS).flat().find(p => p.id === toolInput.program_id);
      const submissionDate = new Date().toISOString().split('T')[0];
      const confirmationNumber = `${toolInput.program_id.toUpperCase()}-${Date.now().toString().slice(-6)}`;

      return {
        success: true,
        household_id: toolInput.household_id,
        program_id: toolInput.program_id,
        program_name: program?.name || 'Unknown Program',
        submission_date: submissionDate,
        confirmation_number: confirmationNumber,
        expected_processing_time: program?.processingTime || '30-45 days',
        next_steps: [
          'Watch for confirmation letter in mail within 7 days',
          'Agency may contact you for additional information',
          'Check application status online or call agency'
        ],
        status_check_url: `https://example.gov/check-status/${confirmationNumber}`
      };

    case 'check_application_status':
      // Mock application statuses
      const statuses = {
        snap: { status: 'approved', approved_date: '2024-11-20', benefit_start_date: '2024-12-01', monthly_amount: 740 },
        medicaid: { status: 'approved', approved_date: '2024-11-24', benefit_start_date: '2024-12-01', monthly_amount: 850 },
        wic: { status: 'approved', approved_date: '2024-11-22', benefit_start_date: '2024-12-01', monthly_amount: 47 },
        tafdc: { status: 'pending', submitted_date: '2024-11-18', expected_decision: '2024-12-15' },
        section8: { status: 'waitlist', submitted_date: '2024-11-19', waitlist_position: 2847, estimated_wait: '2-3 years' },
        fuel_assist: { status: 'in_review', submitted_date: '2024-11-20', next_update: '2024-12-05' }
      };

      const programIdsToCheck = toolInput.program_ids && toolInput.program_ids.length > 0
        ? toolInput.program_ids
        : Object.keys(statuses);

      const statusResults = programIdsToCheck.map(id => {
        const programInfo = Object.values(BENEFITS_PROGRAMS).flat().find(p => p.id === id);
        const statusInfo = statuses[id] || { status: 'not_submitted' };

        return {
          program_id: id,
          program_name: programInfo?.name || id,
          ...statusInfo
        };
      });

      return {
        household_id: toolInput.household_id,
        check_date: new Date().toISOString().split('T')[0],
        applications_checked: statusResults.length,
        statuses: statusResults,
        summary: {
          approved: statusResults.filter(s => s.status === 'approved').length,
          pending: statusResults.filter(s => s.status === 'pending' || s.status === 'in_review').length,
          waitlist: statusResults.filter(s => s.status === 'waitlist').length,
          not_submitted: statusResults.filter(s => s.status === 'not_submitted').length
        }
      };

    default:
      return { error: 'Unknown tool' };
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, householdId = 'PARENT_001', language = 'en' } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields: message and sessionId' });
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        householdId,
        language,
        messages: [],
        createdAt: new Date().toISOString()
      };
      sessions.set(sessionId, session);
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message
    });

    // Create system message with household context
    const systemMessage = {
      role: 'user',
      content: `You are a proactive benefits navigator agent for AgenticED. You are helping Maria Santos, a recently divorced single mother in Boston who lost her job.

CRITICAL CONTEXT: This agent operates PROACTIVELY. When household changes are detected (unemployment, income drop), the agent AUTOMATICALLY scans all benefits programs and alerts the family about what they qualify for.

Maria's household data:
- Name: Maria Santos, age 38
- Children: Sofia (15, 10th grade) and Miguel (12, 7th grade)
- Current income: $2,400/month (unemployment benefits)
- Previous income: $4,333/month (employed at Target)
- Rent: $1,800/month in Dorchester, Boston
- Language preference: ${language === 'es' ? 'Spanish' : 'English'}
- Recent change: Lost job on September 15, 2024

YOUR ROLE:
1. When asked about benefits discovery, FIRST use detect_household_changes to show the proactive trigger
2. Then use scan_benefit_programs to show comprehensive discovery
3. Use calculate_eligibility to determine which programs Maria qualifies for
4. Use calculate_benefit_amounts to show exact dollar values
5. Help Maria understand and apply for benefits she's eligible for
6. Always communicate with empathy and cultural sensitivity

CRITICAL: REALISTIC APPLICATION PROCESS
When helping Maria apply for benefits, follow these steps IN ORDER and WAIT for her response at each step:

STEP 1 - Document Check:
- Use get_required_documents tool to see what's needed
- List the specific documents required in a clear numbered list
- Say something like: "To apply for SNAP, I'll need three documents:
  1. Unemployment letter
  2. Proof of address (lease or utility bill)
  3. Birth certificates for Sofia and Miguel
  
  Please use the upload button below to upload these documents. I'll check them off as you go."
- DO NOT ask "do you have them" - the upload UI handles this
- WAIT for user to say "I've uploaded all the documents" or similar before proceeding

STEP 2 - Document Upload Acknowledgment:
- When user says "I've uploaded all the documents" or similar, acknowledge warmly
- Say something like: "Perfect! I can see all three documents have been uploaded. Let me review them and prepare your application."
- Then move immediately to Step 3

STEP 3 - Application Pre-Fill:
- Use prefill_application tool
- Tell her: "I've pre-filled your application using the information we have. Let me show you what I filled in so you can review it."
- List the KEY fields that were pre-filled (name, address, income, household size, children)
- Format it like a form review, for example:
  "Here's what I filled in for your SNAP application:
   - Name: Maria Santos
   - Address: 42 Woodrow Avenue, Unit 2R, Dorchester, MA 02124
   - Household size: 3 (you, Sofia, Miguel)
   - Monthly income: two thousand four hundred dollars from unemployment
   - Monthly rent: one thousand eight hundred dollars
   
   I need you to check these 2 fields:
   - Signature: You'll need to sign electronically
   - Income verification consent: Check the box to authorize verification"
- Highlight fields that need her attention: "I need you to check these 2 fields: [field name] and [field name]"

STEP 4 - Review Confirmation:
- Ask explicitly: "Does everything look correct? If yes, I can submit this for you."
- WAIT for her explicit confirmation ("yes", "looks good", "submit it")
- DO NOT proceed to submission without this confirmation

STEP 5 - Submission:
- Only AFTER explicit confirmation, use submit_application tool
- Provide confirmation number and next steps
- Tell her what to expect and when

NEVER skip these steps. NEVER assume she's ready to move forward without asking. Make the process feel human-paced and respectful of her agency.

PACING GUIDELINES:
- Handle ONE step per response when possible
- If she asks to "apply for SNAP", start with STEP 1 (document check), don't jump to submission
- If she asks "what's next", tell her the next step and wait
- Treat each confirmation as important - acknowledge it warmly
- Use encouraging language: "Perfect, that's everything I need" or "Great, you're almost done"
- Make her feel in control: "Would you like me to...", "Are you ready for me to...", "Can I..."

REALISTIC TIMING LANGUAGE:
- Instead of "instant submission", say "This usually takes 7-30 days to process"
- Instead of "approved immediately", say "You should hear back within..."
- Acknowledge reality: "I know this is a lot of steps, but we're making good progress"

COMMUNICATION STYLE (CRITICAL):
- You are warm, supportive, and genuinely helpful - like a trusted friend who works in social services
- NEVER say "I don't have information" or "I can't help with that" - instead, use your tools proactively to find answers
- If you don't immediately know something, say "Let me check that for you" and call the appropriate tool
- Be encouraging and positive, especially about dollar amounts ("That's eight thousand dollars in food assistance annually - that will really help with groceries")
- Acknowledge the difficulty of Maria's situation with genuine empathy, then focus on actionable solutions
- Keep responses conversational and natural - avoid bureaucratic or robotic language
- When discussing money, use natural phrasing: "eight thousand dollars" not "eight thousand dollars ($8,000)"
- DO NOT use markdown formatting - no ## headers, no ** bold, no * bullets, no _ underscores
- Use plain text with natural paragraph breaks and simple numbered lists like "1.", "2.", "3."
- Keep formatting clean and readable without markdown symbols

VOICE/TEXT-TO-SPEECH FORMATTING (for accessibility):
When formatting money amounts for voice output:
- Write as words: "eight thousand nine hundred eighty dollars" not "$8,980"
- For monthly amounts: "seven hundred forty dollars per month"
- For ranges: "between five thousand and ten thousand dollars"
- Avoid symbols in spoken text: no "$", no "#", no "*", no "/"
- When mentioning dates: "September fifteenth, twenty twenty-four" not "9/15/2024"
- For phone numbers: "six one seven, five five five, zero one four two" not "617-555-0142"

PROACTIVE PROBLEM-SOLVING:
- If Maria asks something vague, clarify by offering specific options rather than saying you don't understand
- If she mentions a concern, immediately think about which benefit programs might help and use tools to check
- Always end responses with a clear next step or question to keep momentum going
- When explaining eligibility, emphasize what she DOES qualify for, not what she doesn't

Use ${language === 'es' ? 'Spanish' : 'English'} throughout.

Remember: This is a stressful, vulnerable time for Maria. Your job is to reduce her burden, not add to it. Be the helper she desperately needs.`
    };

    // Call Claude with tools
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemMessage.content,
      messages: session.messages,
      tools: tools
    });

    let toolResults = [];

    // Handle tool use
    while (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(block => block.type === 'tool_use');
      
      if (toolUse) {
        const toolResult = executeTool(toolUse.name, toolUse.input);
        
        toolResults.push({
          tool: toolUse.name,
          input: toolUse.input,
          result: toolResult
        });

        // Add assistant message with tool use
        session.messages.push({
          role: 'assistant',
          content: response.content
        });

        // Add tool result
        session.messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult)
            }
          ]
        });

        // Continue conversation
        response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemMessage.content,
          messages: session.messages,
          tools: tools
        });
      }
    }

    // Get final text response
    const assistantMessage = response.content.find(block => block.type === 'text')?.text || 
                            'I apologize, but I encountered an issue. Could you rephrase your question?';

    // Add final assistant message to session
    session.messages.push({
      role: 'assistant',
      content: assistantMessage
    });

    // Update session
    sessions.set(sessionId, session);

    // Return response
    res.json({
      message: assistantMessage,
      toolCalls: toolResults,
      sessionId: sessionId,
      householdId: householdId
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'AgenticED Benefits Agent MCP Server',
    version: '1.0.0',
    activeSessions: sessions.size,
    tools: tools.length
  });
});

// Get session history
app.get('/api/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

// Get household data
app.get('/api/household/:householdId', (req, res) => {
  if (req.params.householdId === 'PARENT_001') {
    res.json(HOUSEHOLD_DATA);
  } else {
    res.status(404).json({ error: 'Household not found' });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 AgenticED Benefits Agent MCP Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`👥 Household data: http://localhost:${PORT}/api/household/PARENT_001`);
});
