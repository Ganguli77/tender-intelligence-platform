package com.tender.backend.configs;

import com.tender.backend.model.Tender;
import com.tender.backend.model.User;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.repository.UserRepository;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final TenderRepository tenderRepository;
    private final UserRepository userRepository;
    private final boolean seedData;

    public DataInitializer(
            TenderRepository tenderRepository,
            UserRepository userRepository,
            @Value("${app.seed-data:true}") boolean seedData
    ) {
        this.tenderRepository = tenderRepository;
        this.userRepository = userRepository;
        this.seedData = seedData;
    }

    @Override
    public void run(String... args) {
        if (!seedData) {
            return;
        }

        seedAdminUser();

        List<Tender> seedTenders = List.of(
                tender(
                        "PWD/ROAD/2026/104",
                        "Road Construction and Drainage Upgrade",
                        "PWD Maharashtra",
                        "Government",
                        "Construction",
                        "Nagpur, Maharashtra",
                        125000000L,
                        "INR 12.50 Cr",
                        "INR 25 Lakh",
                        "Open",
                        "2026-06-01",
                        "2026-07-30",
                        "tenders@pwdmaha.gov.in",
                        List.of(
                                "Registered Class I civil contractor",
                                "Minimum 3 years road and drainage work experience",
                                "Average annual turnover of INR 5 Cr in the last 3 financial years",
                                "Valid GST, PAN, and professional tax registration"
                        ),
                        List.of(
                                "Company registration certificate",
                                "Work completion certificates",
                                "Audited financial statements",
                                "Technical bid and price schedule",
                                "GST and PAN documents"
                        ),
                        "Construction of district road stretches with side drainage, junction improvement, safety markings, quality testing, and milestone-based delivery."
                ),
                tender(
                        "EDU/SMART/2026/219",
                        "Smart Classroom Digital Learning Setup",
                        "Education Department Madhya Pradesh",
                        "Government",
                        "IT",
                        "Bhopal, Madhya Pradesh",
                        87500000L,
                        "INR 8.75 Cr",
                        "INR 12 Lakh",
                        "Open",
                        "2026-06-08",
                        "2026-08-05",
                        "procurement@educationmp.gov.in",
                        List.of(
                                "Authorized IT hardware and software supplier",
                                "Prior smart classroom deployment in at least 50 classrooms",
                                "OEM authorization for display panels and learning software",
                                "Local service support team available in Madhya Pradesh"
                        ),
                        List.of(
                                "OEM authorization letter",
                                "Product brochures and compliance sheet",
                                "Warranty and service undertaking",
                                "Implementation plan",
                                "Commercial bid"
                        ),
                        "Supply, installation, teacher training, and support for interactive boards, learning software, networking, and classroom accessories."
                ),
                tender(
                        "HM/EQUIP/2026/087",
                        "Hospital Equipment Supply and Maintenance",
                        "Health Ministry Uttar Pradesh",
                        "Government",
                        "Healthcare",
                        "Lucknow, Uttar Pradesh",
                        100000000L,
                        "INR 10.00 Cr",
                        "INR 20 Lakh",
                        "Open",
                        "2026-06-10",
                        "2026-08-12",
                        "medicaltenders@healthup.gov.in",
                        List.of(
                                "Licensed medical equipment supplier",
                                "ISO 13485 or equivalent quality certification",
                                "Service engineers available in the state",
                                "Minimum 5 similar hospital supply orders completed"
                        ),
                        List.of(
                                "Medical device license",
                                "Quality certificates",
                                "Installation and maintenance plan",
                                "Past performance certificates",
                                "Financial bid"
                        ),
                        "Procurement, installation, calibration, training, and maintenance support for essential hospital equipment across district facilities."
                ),
                tender(
                        "UDA/SOLAR/2026/331",
                        "Solar Street Light Installation",
                        "Urban Development Authority Jaipur",
                        "Government",
                        "Renewable Energy",
                        "Jaipur, Rajasthan",
                        75000000L,
                        "INR 7.50 Cr",
                        "INR 15 Lakh",
                        "Open",
                        "2026-06-14",
                        "2026-08-18",
                        "solarprocurement@udajaipur.gov.in",
                        List.of(
                                "MNRE-approved solar vendor",
                                "Minimum 500 solar light installations completed",
                                "Five-year comprehensive maintenance capability",
                                "Authorized battery and luminaire sourcing"
                        ),
                        List.of(
                                "MNRE approval certificate",
                                "Technical specification sheet",
                                "Past project completion certificates",
                                "Maintenance plan",
                                "Warranty certificate"
                        ),
                        "Supply, installation, commissioning, and maintenance of smart solar street lights in selected urban wards and public spaces."
                ),
                tender(
                        "JSD/WATER/2026/512",
                        "Rural Water Supply Pipeline Project",
                        "Jal Shakti Department",
                        "Government",
                        "Water Supply",
                        "Ranchi, Jharkhand",
                        156000000L,
                        "INR 15.60 Cr",
                        "INR 30 Lakh",
                        "Closing Soon",
                        "2026-06-16",
                        "2026-07-26",
                        "waterprojects@jalshakti.gov.in",
                        List.of(
                                "Registered water infrastructure contractor",
                                "Experience in pipeline laying and pump house construction",
                                "Hydraulic testing capability",
                                "Valid safety and labor compliance documents"
                        ),
                        List.of(
                                "Contractor registration",
                                "Pipeline work experience certificates",
                                "Equipment ownership or lease proof",
                                "Quality assurance plan",
                                "Financial statements"
                        ),
                        "Laying of rural water distribution pipelines, pump station upgrades, household connection support, testing, and commissioning."
                ),
                tender(
                        "CPWD/FM/2026/744",
                        "Government Building Facility Maintenance",
                        "Central Public Works Department",
                        "Government",
                        "Maintenance",
                        "New Delhi",
                        32000000L,
                        "INR 3.20 Cr",
                        "INR 6 Lakh",
                        "Open",
                        "2026-06-20",
                        "2026-09-02",
                        "facilitytenders@cpwd.gov.in",
                        List.of(
                                "Facility management agency with government project experience",
                                "Skilled electrical, plumbing, HVAC, and housekeeping staff",
                                "ESI, PF, GST, and labor license compliance",
                                "24x7 complaint response capability"
                        ),
                        List.of(
                                "Agency registration certificate",
                                "Manpower deployment plan",
                                "Statutory compliance documents",
                                "Past maintenance contracts",
                                "Price bid"
                        ),
                        "Comprehensive annual maintenance of government office buildings including electrical systems, plumbing, HVAC support, housekeeping, and helpdesk operations."
                ),
                tender(
                        "IR/WIFI/2026/619",
                        "Indian Railways Station Wi-Fi Modernization",
                        "Indian Railways",
                        "Public Sector",
                        "Telecom",
                        "Pune, Maharashtra",
                        54000000L,
                        "INR 5.40 Cr",
                        "INR 10 Lakh",
                        "Open",
                        "2026-06-22",
                        "2026-08-28",
                        "itprocurement@railways.gov.in",
                        List.of(
                                "Network integrator with public Wi-Fi deployment experience",
                                "OEM authorization for access points and controllers",
                                "Cybersecurity and logging compliance capability",
                                "Onsite support team for railway stations"
                        ),
                        List.of(
                                "Network architecture proposal",
                                "OEM authorization letters",
                                "Security compliance declaration",
                                "SLA and support plan",
                                "Commercial bid"
                        ),
                        "Modernization of station Wi-Fi infrastructure with access points, controllers, monitoring, cybersecurity compliance, and managed support."
                ),
                tender(
                        "SECI/EPC/2026/188",
                        "Solar Power Plant EPC Package",
                        "Solar Energy Corporation of India",
                        "Public Sector",
                        "Renewable Energy",
                        "Kurnool, Andhra Pradesh",
                        250000000L,
                        "INR 25.00 Cr",
                        "INR 50 Lakh",
                        "Expired",
                        "2026-05-05",
                        "2026-06-10",
                        "epc@seci.co.in",
                        List.of(
                                "Solar EPC contractor with utility-scale project experience",
                                "Completed at least one project above 10 MW",
                                "Electrical contractor license",
                                "Operation and maintenance capability for 5 years"
                        ),
                        List.of(
                                "EPC credentials",
                                "Electrical license",
                                "Plant layout and technical proposal",
                                "O&M plan",
                                "Financial bid"
                        ),
                        "Engineering, procurement, construction, grid synchronization, testing, and maintenance of a solar power plant package."
                ),
                tender(
                        "BMTC/EV/2026/402",
                        "Electric Bus Charging Depot Setup",
                        "Bengaluru Metropolitan Transport Corporation",
                        "Government",
                        "Transport",
                        "Bengaluru, Karnataka",
                        182000000L,
                        "INR 18.20 Cr",
                        "INR 36 Lakh",
                        "Open",
                        "2026-06-24",
                        "2026-09-10",
                        "evprojects@bmtc.gov.in",
                        List.of(
                                "EV charging infrastructure provider",
                                "Experience with at least 20 DC fast chargers",
                                "Electrical safety certification and licensed engineers",
                                "Five-year operations and maintenance capability"
                        ),
                        List.of(
                                "Company registration certificate",
                                "EV charger OEM authorization",
                                "Electrical contractor license",
                                "Project execution plan",
                                "Financial bid"
                        ),
                        "Design, supply, installation, testing, commissioning, and maintenance of electric bus charging infrastructure at selected depots."
                ),
                tender(
                        "DITK/CYBER/2026/266",
                        "State Data Center Cybersecurity Enhancement",
                        "Department of Information Technology Kerala",
                        "Government",
                        "Cybersecurity",
                        "Thiruvananthapuram, Kerala",
                        64000000L,
                        "INR 6.40 Cr",
                        "INR 12 Lakh",
                        "Open",
                        "2026-06-25",
                        "2026-08-22",
                        "cyberprocurement@kerala.gov.in",
                        List.of(
                                "CERT-In empanelled cybersecurity service provider",
                                "SOC implementation or managed security experience",
                                "Certified security professionals on payroll",
                                "Experience with government or public sector data centers"
                        ),
                        List.of(
                                "CERT-In empanelment certificate",
                                "Technical solution architecture",
                                "Security operations plan",
                                "Team certification details",
                                "Commercial proposal"
                        ),
                        "Implementation of endpoint security, SIEM integration, vulnerability management, incident response workflow, and managed monitoring for the state data center."
                ),
                tender(
                        "IMC/SWM/2026/578",
                        "Municipal Solid Waste Processing Facility",
                        "Indore Municipal Corporation",
                        "Municipal",
                        "Waste Management",
                        "Indore, Madhya Pradesh",
                        210000000L,
                        "INR 21.00 Cr",
                        "INR 42 Lakh",
                        "Open",
                        "2026-06-26",
                        "2026-09-18",
                        "swm@imcindore.org",
                        List.of(
                                "Waste processing operator with municipal project experience",
                                "Experience handling minimum 100 TPD solid waste",
                                "Environmental compliance and pollution control approvals",
                                "Operation and maintenance capability for 7 years"
                        ),
                        List.of(
                                "Municipal waste processing credentials",
                                "Environmental compliance documents",
                                "Plant and machinery details",
                                "O&M methodology",
                                "Financial statements"
                        ),
                        "Development, operation, and maintenance of a solid waste processing facility including segregation, composting, material recovery, and reporting systems."
                ),
                tender(
                        "SEDTN/MDM/2026/337",
                        "Mid-Day Meal Food Grain Supply",
                        "School Education Department Tamil Nadu",
                        "Government",
                        "Food Supply",
                        "Chennai, Tamil Nadu",
                        98000000L,
                        "INR 9.80 Cr",
                        "INR 18 Lakh",
                        "Open",
                        "2026-06-18",
                        "2026-08-14",
                        "nutritionprocurement@tn.gov.in",
                        List.of(
                                "FSSAI licensed food supplier",
                                "Experience in bulk institutional food grain supply",
                                "Warehouse and logistics capability across districts",
                                "Quality testing and batch traceability process"
                        ),
                        List.of(
                                "FSSAI license",
                                "Warehouse ownership or lease proof",
                                "Food quality certificates",
                                "Logistics deployment plan",
                                "Price schedule"
                        ),
                        "Supply and district-wise delivery of quality food grains for school nutrition programs with testing, packaging, tracking, and timely distribution."
                ),
                tender(
                        "RDG/DRONE/2026/095",
                        "Drone Survey for Land Records Digitization",
                        "Revenue Department Gujarat",
                        "Government",
                        "Survey",
                        "Ahmedabad, Gujarat",
                        45500000L,
                        "INR 4.55 Cr",
                        "INR 9 Lakh",
                        "Open",
                        "2026-06-21",
                        "2026-09-05",
                        "landsurvey@gujarat.gov.in",
                        List.of(
                                "DGCA-compliant drone survey agency",
                                "Experience in GIS mapping and cadastral survey",
                                "Licensed drone pilots and survey engineers",
                                "Data processing capability for orthomosaic outputs"
                        ),
                        List.of(
                                "Drone registration and pilot credentials",
                                "GIS survey project certificates",
                                "Technical methodology",
                                "Data security undertaking",
                                "Financial bid"
                        ),
                        "Drone-based survey, GIS mapping, orthomosaic generation, and digital record support for selected rural and semi-urban land parcels."
                ),
                tender(
                        "DHSO/LINEN/2026/441",
                        "Public Hospital Laundry and Linen Services",
                        "Directorate of Health Services Odisha",
                        "Government",
                        "Healthcare",
                        "Bhubaneswar, Odisha",
                        26500000L,
                        "INR 2.65 Cr",
                        "INR 5 Lakh",
                        "Closing Soon",
                        "2026-06-12",
                        "2026-07-20",
                        "hospitalservices@odisha.gov.in",
                        List.of(
                                "Healthcare laundry service provider",
                                "Experience servicing minimum 300 hospital beds",
                                "Infection control and biomedical handling protocol",
                                "Barcode or digital tracking capability"
                        ),
                        List.of(
                                "Service provider registration",
                                "Hospital service experience certificates",
                                "Infection control SOP",
                                "Manpower and equipment plan",
                                "Commercial quote"
                        ),
                        "Collection, washing, disinfection, ironing, packaging, and delivery of hospital linen with digital tracking and quality monitoring."
                ),
                tender(
                        "NIC/CLOUD/2026/812",
                        "Cloud Migration for Citizen Services Portal",
                        "National Informatics Centre",
                        "Government",
                        "Cloud Services",
                        "New Delhi",
                        72000000L,
                        "INR 7.20 Cr",
                        "INR 14 Lakh",
                        "Open",
                        "2026-06-27",
                        "2026-09-25",
                        "cloudtenders@nic.in",
                        List.of(
                                "Cloud migration partner with government workload experience",
                                "Certified architects for selected cloud platform",
                                "Application modernization and DevOps capability",
                                "Security, backup, and disaster recovery implementation experience"
                        ),
                        List.of(
                                "Cloud partner certification",
                                "Migration methodology",
                                "Security and DR plan",
                                "Resource deployment matrix",
                                "Commercial bid"
                        ),
                        "Assessment, migration, optimization, security hardening, and managed support for citizen service applications moving to cloud infrastructure."
                ),
                tender(
                        "AUDA/SMARTLIGHT/2026/629",
                        "Riverfront LED Lighting and Smart Poles",
                        "Ahmedabad Urban Development Authority",
                        "Government",
                        "Smart City",
                        "Ahmedabad, Gujarat",
                        118000000L,
                        "INR 11.80 Cr",
                        "INR 23 Lakh",
                        "Open",
                        "2026-06-19",
                        "2026-08-31",
                        "smartcity@auda.org.in",
                        List.of(
                                "Smart lighting integrator",
                                "Experience with LED street lighting and smart pole projects",
                                "IoT controller and central monitoring system capability",
                                "Three-year maintenance support commitment"
                        ),
                        List.of(
                                "Technical product datasheets",
                                "Smart lighting project credentials",
                                "CMS architecture proposal",
                                "Maintenance plan",
                                "Price bid"
                        ),
                        "Supply and installation of LED lighting, smart poles, IoT controllers, cabling, and central monitoring for selected riverfront stretches."
                ),
                tender(
                        "AMB/PB/COLD/2026/284",
                        "Agricultural Cold Storage Warehouse Construction",
                        "Agriculture Marketing Board Punjab",
                        "Government",
                        "Agriculture",
                        "Ludhiana, Punjab",
                        145000000L,
                        "INR 14.50 Cr",
                        "INR 29 Lakh",
                        "Open",
                        "2026-06-23",
                        "2026-10-03",
                        "infra@agrimarketpunjab.gov.in",
                        List.of(
                                "Civil contractor with cold storage construction experience",
                                "Refrigeration system installation capability",
                                "Food storage safety and insulation knowledge",
                                "Completed warehouse project above INR 5 Cr"
                        ),
                        List.of(
                                "Construction credentials",
                                "Refrigeration OEM tie-up details",
                                "Structural and MEP proposal",
                                "Project schedule",
                                "Financial bid"
                        ),
                        "Construction of agricultural cold storage facility with insulated panels, refrigeration systems, loading bays, power backup, and monitoring controls."
                ),
                tender(
                        "HPC/CCTV/2026/357",
                        "City Surveillance Camera Network Expansion",
                        "Hyderabad Police Commissionerate",
                        "Government",
                        "Security",
                        "Hyderabad, Telangana",
                        132000000L,
                        "INR 13.20 Cr",
                        "INR 26 Lakh",
                        "Open",
                        "2026-06-15",
                        "2026-08-09",
                        "surveillance@hydpolice.gov.in",
                        List.of(
                                "System integrator with city surveillance experience",
                                "OEM authorization for cameras, storage, and networking",
                                "Command center integration capability",
                                "Five-year warranty and onsite support commitment"
                        ),
                        List.of(
                                "System integration credentials",
                                "OEM authorization letters",
                                "Network and storage design",
                                "Warranty and support plan",
                                "Commercial offer"
                        ),
                        "Expansion of city surveillance camera network with IP cameras, fiber connectivity, video storage, analytics integration, and command center monitoring."
                ),
                tender(
                        "MCH/SMARTPARK/2026/501",
                        "Metro City Smart Parking System",
                        "Metro City Corporation",
                        "Municipal",
                        "Smart City",
                        "Pune, Maharashtra",
                        42000000L,
                        "INR 4.20 Cr",
                        "INR 8 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-12",
                        "parking@metrocity.gov.in",
                        List.of(
                                "Parking technology integrator",
                                "Experience with ANPR or RFID-based parking systems",
                                "Mobile payment and dashboard integration capability",
                                "Operations support for at least 3 years"
                        ),
                        List.of(
                                "Company profile",
                                "Technology architecture",
                                "Implementation plan",
                                "Support SLA",
                                "Commercial bid"
                        ),
                        "Design, supply, installation, and support of smart parking infrastructure across municipal parking zones and public facilities."
                ),
                tender(
                        "TRN/ELECTRIC/2026/642",
                        "Electric City Bus Fleet Supply",
                        "Transport Department Gujarat",
                        "Government",
                        "Transport",
                        "Surat, Gujarat",
                        198000000L,
                        "INR 19.80 Cr",
                        "INR 40 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-28",
                        "transportprocurement@gujarat.gov.in",
                        List.of(
                                "Bus OEM or authorized dealer",
                                "Experience supplying electric buses to public fleets",
                                "After-sales service and charging support capability",
                                "Type approval and compliance documentation"
                        ),
                        List.of(
                                "OEM authorization",
                                "Type approval certificates",
                                "Service network details",
                                "Delivery schedule",
                                "Financial bid"
                        ),
                        "Supply of electric buses for municipal routes with charging support, warranty coverage, and operational training."
                ),
                tender(
                        "WRM/RAIN/2026/713",
                        "Urban Rainwater Harvesting Retrofit",
                        "Water Resources Department Karnataka",
                        "Government",
                        "Water Supply",
                        "Mysuru, Karnataka",
                        36000000L,
                        "INR 3.60 Cr",
                        "INR 7 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-20",
                        "water@karnataka.gov.in",
                        List.of(
                                "Civil works contractor with water conservation experience",
                                "Proven rooftop and recharge pit installation portfolio",
                                "Local site team and safety compliance",
                                "Wastewater and stormwater handling knowledge"
                        ),
                        List.of(
                                "Past project credentials",
                                "Technical design",
                                "Work schedule",
                                "Safety plan",
                                "Commercial proposal"
                        ),
                        "Retrofit government buildings and public campuses with rooftop harvesting, recharge wells, and stormwater management systems."
                ),
                tender(
                        "HEA/DIAG/2026/548",
                        "Diagnostic Equipment Modernization",
                        "Health Services Rajasthan",
                        "Government",
                        "Healthcare",
                        "Udaipur, Rajasthan",
                        78000000L,
                        "INR 7.80 Cr",
                        "INR 16 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-04",
                        "diagnostics@rajasthanhealth.gov.in",
                        List.of(
                                "Medical diagnostics supplier",
                                "Service engineers in western India",
                                "Installation, calibration, and training capability",
                                "Compliance with healthcare procurement norms"
                        ),
                        List.of(
                                "OEM authorization",
                                "Equipment specifications",
                                "Service and calibration plan",
                                "Warranty commitment",
                                "Commercial bid"
                        ),
                        "Supply and maintenance of modern diagnostic equipment for district hospitals and medical colleges."
                ),
                tender(
                        "EDU/NET/2026/677",
                        "University Campus Fiber Backbone Upgrade",
                        "Higher Education Department Odisha",
                        "Government",
                        "Telecom",
                        "Cuttack, Odisha",
                        56000000L,
                        "INR 5.60 Cr",
                        "INR 11 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-26",
                        "it@highered.odisha.gov.in",
                        List.of(
                                "Telecom contractor with fiber backbone experience",
                                "Campus network design and commissioning capability",
                                "Structured cabling and network testing expertise",
                                "Onsite support team"
                        ),
                        List.of(
                                "Network design",
                                "Fiber certification",
                                "Implementation schedule",
                                "Support matrix",
                                "Commercial bid"
                        ),
                        "Upgrade the university’s fiber backbone, network rooms, campus distribution, and monitoring infrastructure."
                ),
                tender(
                        "AGR/PROC/2026/390",
                        "Farm Equipment Supply and Service",
                        "Agriculture Department Haryana",
                        "Government",
                        "Agriculture",
                        "Hisar, Haryana",
                        47000000L,
                        "INR 4.70 Cr",
                        "INR 9 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-15",
                        "agri@haryana.gov.in",
                        List.of(
                                "Agricultural machinery dealer",
                                "Service and spare-parts support network",
                                "Experience in institutional equipment delivery",
                                "GST and statutory compliance"
                        ),
                        List.of(
                                "Dealer authorization",
                                "Product catalogue",
                                "Service plan",
                                "Delivery plan",
                                "Commercial quote"
                        ),
                        "Supply and support of farm equipment, accessories, and after-sales service for government agriculture programs."
                ),
                tender(
                        "CIV/BRIDGE/2026/255",
                        "District Bridge Rehabilitation Works",
                        "Public Works Department Assam",
                        "Government",
                        "Construction",
                        "Guwahati, Assam",
                        91000000L,
                        "INR 9.10 Cr",
                        "INR 18 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-16",
                        "pwda@assam.gov.in",
                        List.of(
                                "Bridge rehabilitation contractor",
                                "Structural repair and retrofitting experience",
                                "Quality testing and site safety capability",
                                "Registered contractor class II or above"
                        ),
                        List.of(
                                "Contractor registration",
                                "Structural method statement",
                                "Past bridge work certificates",
                                "Quality assurance plan",
                                "Financial bid"
                        ),
                        "Repair and strengthen district bridges including deck rehabilitation, expansion joints, surface treatment, and safety upgrades."
                ),
                tender(
                        "URB/WASTE/2026/446",
                        "City Sanitation Fleet Operation",
                        "Urban Local Body Indore",
                        "Municipal",
                        "Waste Management",
                        "Indore, Madhya Pradesh",
                        53000000L,
                        "INR 5.30 Cr",
                        "INR 10 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-01",
                        "sanitation@indore.nic.in",
                        List.of(
                                "Sanitation operations vendor",
                                "Fleet and manpower deployment experience",
                                "GPS tracking and reporting capability",
                                "Municipal service compliance"
                        ),
                        List.of(
                                "Company profile",
                                "Fleet list",
                                "Staff deployment plan",
                                "Reporting format",
                                "Commercial offer"
                        ),
                        "Operation of sanitation vehicles, route planning, daily reporting, and city cleaning support services."
                ),
                tender(
                        "INF/BRD/2026/112",
                        "Regional Data Backup and Disaster Recovery",
                        "State IT Mission Telangana",
                        "Government",
                        "Cloud Services",
                        "Hyderabad, Telangana",
                        84000000L,
                        "INR 8.40 Cr",
                        "INR 17 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-30",
                        "dr@telangana.gov.in",
                        List.of(
                                "Infrastructure or cloud DR provider",
                                "Backup orchestration and restore testing experience",
                                "Security and compliance expertise",
                                "24x7 monitoring support"
                        ),
                        List.of(
                                "Architecture diagram",
                                "DR methodology",
                                "Security controls list",
                                "Testing schedule",
                                "Commercial bid"
                        ),
                        "Provide regional backup, replication, disaster recovery orchestration, and periodic restoration testing for state services."
                ),
                tender(
                        "SEC/GATE/2026/721",
                        "Government Campus Access Control Upgrade",
                        "Home Department Kerala",
                        "Government",
                        "Security",
                        "Kochi, Kerala",
                        27500000L,
                        "INR 2.75 Cr",
                        "INR 5 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-07-24",
                        "security@kerala.gov.in",
                        List.of(
                                "Security systems integrator",
                                "Access control and visitor management experience",
                                "Onsite commissioning and training capability",
                                "Maintenance support commitment"
                        ),
                        List.of(
                                "Technical proposal",
                                "Device catalog",
                                "Integration plan",
                                "Support SLA",
                                "Commercial quote"
                        ),
                        "Install smart access control, visitor management, and monitoring systems for government campuses."
                ),
                tender(
                        "MCH/HOSP/2026/930",
                        "Hospital Bed and Furniture Procurement",
                        "Public Health Authority Maharashtra",
                        "Government",
                        "Healthcare",
                        "Nashik, Maharashtra",
                        30500000L,
                        "INR 3.05 Cr",
                        "INR 6 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-08",
                        "procurement@publichealthmh.gov.in",
                        List.of(
                                "Hospital furniture supplier",
                                "Bulk manufacturing or distribution capability",
                                "Quality and warranty compliance",
                                "Delivery across multiple facilities"
                        ),
                        List.of(
                                "Product brochure",
                                "Warranty statement",
                                "Delivery schedule",
                                "Inspection plan",
                                "Commercial bid"
                        ),
                        "Supply hospital beds, stretchers, bedside lockers, and related furniture for public health facilities."
                ),
                tender(
                        "SPD/PORT/2026/604",
                        "Port Security Lighting and CCTV",
                        "Port Trust Gujarat",
                        "Public Sector",
                        "Security",
                        "Kandla, Gujarat",
                        69000000L,
                        "INR 6.90 Cr",
                        "INR 13 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-20",
                        "portsecurity@gujaratport.gov.in",
                        List.of(
                                "Security infrastructure integrator",
                                "Coastal or industrial site experience",
                                "Outdoor lighting and CCTV capability",
                                "Networking and storage integration expertise"
                        ),
                        List.of(
                                "Technical design",
                                "BoM and compliance sheet",
                                "Installation plan",
                                "Maintenance support",
                                "Commercial bid"
                        ),
                        "Upgrade port perimeter lighting, surveillance, and monitoring systems to improve security coverage."
                ),
                tender(
                        "RLY/SIGNAL/2026/228",
                        "Railway Station Signage and Passenger Info System",
                        "Indian Railways",
                        "Public Sector",
                        "Telecom",
                        "Bhubaneswar, Odisha",
                        58000000L,
                        "INR 5.80 Cr",
                        "INR 12 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-19",
                        "railinfo@ir.gov.in",
                        List.of(
                                "Passenger information system vendor",
                                "Railway or transport sector experience",
                                "Display, audio, and control integration capability",
                                "Onsite installation team"
                        ),
                        List.of(
                                "Vendor credentials",
                                "System architecture",
                                "Implementation timeline",
                                "Warranty and SLA",
                                "Commercial offer"
                        ),
                        "Deploy digital signage, passenger information displays, and public address integration at railway stations."
                ),
                tender(
                        "CIT/SMART/2026/515",
                        "Citywide IoT Environmental Sensors",
                        "Smart City Mission Bhopal",
                        "Government",
                        "Smart City",
                        "Bhopal, Madhya Pradesh",
                        44000000L,
                        "INR 4.40 Cr",
                        "INR 9 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-24",
                        "smartcity@bhopal.gov.in",
                        List.of(
                                "IoT solutions vendor",
                                "Sensor network deployment experience",
                                "Cloud dashboard and reporting capability",
                                "Maintenance and calibration support"
                        ),
                        List.of(
                                "Technical solution",
                                "Sensor catalog",
                                "Maintenance plan",
                                "Data security note",
                                "Commercial bid"
                        ),
                        "Install IoT sensors for air quality, noise, and weather monitoring across the smart city network."
                ),
                tender(
                        "WAT/PLANT/2026/601",
                        "Water Treatment Plant Automation",
                        "Municipal Water Board Gujarat",
                        "Government",
                        "Water Supply",
                        "Vadodara, Gujarat",
                        101000000L,
                        "INR 10.10 Cr",
                        "INR 20 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-08",
                        "waterboard@gujarat.gov.in",
                        List.of(
                                "Automation and control systems integrator",
                                "Water treatment project experience",
                                "PLC/SCADA expertise",
                                "Onsite commissioning support"
                        ),
                        List.of(
                                "Automation design",
                                "Instrumentation list",
                                "Training plan",
                                "Support SLA",
                                "Commercial bid"
                        ),
                        "Automate pumps, dosing systems, and monitoring equipment for municipal water treatment operations."
                ),
                tender(
                        "AGR/LOG/2026/332",
                        "Agriculture Cold Chain Logistics Services",
                        "Agriculture Marketing Board Uttar Pradesh",
                        "Government",
                        "Agriculture",
                        "Kanpur, Uttar Pradesh",
                        65000000L,
                        "INR 6.50 Cr",
                        "INR 13 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-14",
                        "coldchain@upagri.gov.in",
                        List.of(
                                "Cold chain logistics operator",
                                "Refrigerated vehicle fleet availability",
                                "Storage and distribution experience",
                                "Food handling compliance"
                        ),
                        List.of(
                                "Fleet details",
                                "Warehouse proof",
                                "Temperature control process",
                                "Route plan",
                                "Commercial quote"
                        ),
                        "Provide end-to-end cold chain logistics for agricultural produce from collection centers to storage and delivery points."
                ),
                tender(
                        "EDU/PRINT/2026/754",
                        "School Textbook Printing and Distribution",
                        "Education Directorate West Bengal",
                        "Government",
                        "Printing",
                        "Kolkata, West Bengal",
                        33000000L,
                        "INR 3.30 Cr",
                        "INR 6 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-11",
                        "printing@wbedu.gov.in",
                        List.of(
                                "Printing vendor with large-volume capability",
                                "Secure distribution and logistics network",
                                "Quality control and proofing workflow",
                                "Experience in educational content printing"
                        ),
                        List.of(
                                "Printing credentials",
                                "Paper quality declaration",
                                "Distribution plan",
                                "Delivery schedule",
                                "Commercial bid"
                        ),
                        "Print and distribute school textbooks and supporting materials across district education offices."
                ),
                tender(
                        "CIV/ROAD/2026/865",
                        "Rural Road Maintenance Package",
                        "Public Works Department Bihar",
                        "Government",
                        "Construction",
                        "Patna, Bihar",
                        74000000L,
                        "INR 7.40 Cr",
                        "INR 15 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-03",
                        "roads@bihar.gov.in",
                        List.of(
                                "Road maintenance contractor",
                                "Bituminous repair and resurfacing experience",
                                "Equipment and labor deployment capability",
                                "Safety and traffic management plan"
                        ),
                        List.of(
                                "Contractor registration",
                                "Equipment list",
                                "Work methodology",
                                "Traffic diversion plan",
                                "Commercial bid"
                        ),
                        "Maintain and resurface rural road segments, drainage edges, and shoulders under a phased contract."
                ),
                tender(
                        "CLO/HVAC/2026/418",
                        "Government Office HVAC Retrofit",
                        "Estate Department Telangana",
                        "Government",
                        "Maintenance",
                        "Hyderabad, Telangana",
                        51000000L,
                        "INR 5.10 Cr",
                        "INR 10 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-08-27",
                        "estate@telangana.gov.in",
                        List.of(
                                "HVAC contractor with public building experience",
                                "Energy-efficient retrofit capability",
                                "Maintenance and commissioning support",
                                "Qualified technicians on payroll"
                        ),
                        List.of(
                                "Technical proposal",
                                "Equipment datasheets",
                                "Energy savings plan",
                                "Support schedule",
                                "Commercial bid"
                        ),
                        "Retrofit HVAC systems in government office buildings to improve reliability, efficiency, and maintenance support."
                ),
                tender(
                        "IT/DIGI/2026/904",
                        "Citizen Portal Software Enhancement",
                        "National e-Governance Division",
                        "Government",
                        "IT",
                        "New Delhi",
                        87000000L,
                        "INR 8.70 Cr",
                        "INR 17 Lakh",
                        "Open",
                        "2026-06-28",
                        "2026-09-22",
                        "egov@nic.in",
                        List.of(
                                "Software development partner with government portal experience",
                                "Cloud-native and secure coding capability",
                                "Testing, deployment, and support experience",
                                "Team leads with citizen-facing application work"
                        ),
                        List.of(
                                "Solution architecture",
                                "Development methodology",
                                "Testing strategy",
                                "Support plan",
                                "Commercial bid"
                        ),
                        "Enhance citizen portal workflows, forms, analytics, and service tracking with secure web application development."
                )
        );

        ensureTenderSeeds(seedTenders);
        System.out.println("Tender seed sync complete. Total tenders: " + tenderRepository.count());
    }

    private void ensureTenderSeeds(List<Tender> seedTenders) {
        // Match seed tenders by reference number so the live database converges to the curated dataset.
        Map<String, Tender> existingByReference = new HashMap<>();
        tenderRepository.findAll().forEach(tender -> {
            String referenceNo = tender.getReferenceNo();
            if (referenceNo != null && !referenceNo.isBlank()) {
                existingByReference.put(referenceNo, tender);
            }
        });

        List<Tender> toSave = seedTenders.stream()
                .map(seed -> {
                    Tender existing = existingByReference.get(seed.getReferenceNo());
                    if (existing != null) {
                        copySeedFields(seed, existing);
                        return existing;
                    }
                    return seed;
                })
                .toList();

        tenderRepository.saveAll(toSave);
    }

    private void copySeedFields(Tender source, Tender target) {
        // Keep seeded rows aligned with the latest curated values without touching unrelated user-created records.
        target.setTitle(source.getTitle());
        target.setOrganization(source.getOrganization());
        target.setBuyerType(source.getBuyerType());
        target.setCategory(source.getCategory());
        target.setLocation(source.getLocation());
        target.setAmountValue(source.getAmountValue());
        target.setAmount(source.getAmount());
        target.setBidSecurity(source.getBidSecurity());
        target.setStatus(source.getStatus());
        target.setPublishedDate(source.getPublishedDate());
        target.setDeadline(source.getDeadline());
        target.setContact(source.getContact());
        target.setEligibility(source.getEligibility());
        target.setDocuments(source.getDocuments());
        target.setDescription(source.getDescription());
    }

    private void seedAdminUser() {
        userRepository.findByUsername("admin").orElseGet(() -> {
            User admin = new User();
            admin.setName("admin");
            admin.setEmail("admin@nex tender.ai".replace(" ", ""));
            admin.setPassword("admin123");
            admin.setRole("ADMIN");
            return userRepository.save(admin);
        });
    }

    private Tender tender(
            String referenceNo,
            String title,
            String organization,
            String buyerType,
            String category,
            String location,
            Long amountValue,
            String amount,
            String bidSecurity,
            String status,
            String publishedDate,
            String deadline,
            String contact,
            List<String> eligibility,
            List<String> documents,
            String description
    ) {
        Tender tender = new Tender();
        tender.setReferenceNo(referenceNo);
        tender.setTitle(title);
        tender.setOrganization(organization);
        tender.setBuyerType(buyerType);
        tender.setCategory(category);
        tender.setLocation(location);
        tender.setAmountValue(amountValue);
        tender.setAmount(amount);
        tender.setBidSecurity(bidSecurity);
        tender.setStatus(status);
        tender.setPublishedDate(LocalDate.parse(publishedDate));
        tender.setDeadline(LocalDate.parse(deadline));
        tender.setContact(contact);
        tender.setEligibility(eligibility);
        tender.setDocuments(documents);
        tender.setDescription(description);
        return tender;
    }
}
