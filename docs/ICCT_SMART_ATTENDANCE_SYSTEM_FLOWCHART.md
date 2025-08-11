# ICCT Smart Attendance System - System Flowchart

## Overview
This document presents a comprehensive System Flowchart for the ICCT Smart Attendance System, showing the logical flow of operations, decision points, and system processes.

## Main System Flowchart

```mermaid
flowchart TD
    A[Start] --> B[User Access System]
    B --> C{User Type?}
    
    C -->|Student| D[Student Login]
    C -->|Instructor| E[Instructor Login]
    C -->|Parent| F[Parent Login]
    C -->|Admin| G[Admin Login]
    C -->|System Admin| H[SysAdmin Login]
    
    %% Student Flow
    D --> I{Authentication Valid?}
    I -->|No| J[Show Error Message]
    J --> D
    I -->|Yes| K[Student Dashboard]
    K --> L{Student Action?}
    L -->|View Attendance| M[Display Personal Attendance]
    L -->|View Schedule| N[Display Class Schedule]
    L -->|View Courses| O[Display Course Information]
    L -->|Logout| P[End Session]
    
    %% Instructor Flow
    E --> Q{Authentication Valid?}
    Q -->|No| R[Show Error Message]
    R --> E
    Q -->|Yes| S[Instructor Dashboard]
    S --> T{Instructor Action?}
    T -->|View Class Attendance| U[Display Class Attendance]
    T -->|Generate Reports| V[Generate Class Reports]
    T -->|Manage Schedule| W[Update Class Schedule]
    T -->|Manual Attendance| X[Mark Manual Attendance]
    T -->|View Students| Y[Display Student List]
    T -->|Logout| Z[End Session]
    
    %% Parent Flow
    F --> AA{Authentication Valid?}
    AA -->|No| BB[Show Error Message]
    BB --> F
    AA -->|Yes| CC[Parent Dashboard]
    CC --> DD{Parent Action?}
    DD -->|View Child Attendance| EE[Display Child Attendance]
    DD -->|View Progress| FF[Display Academic Progress]
    DD -->|Update Contact| GG[Update Contact Information]
    DD -->|Logout| HH[End Session]
    
    %% Admin Flow
    G --> II{Authentication Valid?}
    II -->|No| JJ[Show Error Message]
    JJ --> G
    II -->|Yes| KK[Admin Dashboard]
    KK --> LL{Admin Action?}
    LL -->|Manage Users| MM[User Management System]
    LL -->|Manage Departments| NN[Department Management]
    LL -->|Manage Courses| OO[Course Management]
    LL -->|System Reports| PP[Generate System Reports]
    LL -->|System Analytics| QQ[View System Analytics]
    LL -->|Logout| RR[End Session]
    
    %% System Admin Flow
    H --> SS{Authentication Valid?}
    SS -->|No| TT[Show Error Message]
    TT --> H
    SS -->|Yes| UU[SysAdmin Dashboard]
    UU --> VV{SysAdmin Action?}
    VV -->|System Backups| WW[Backup Management]
    VV -->|System Health| XX[System Monitoring]
    VV -->|Security Settings| YY[Security Configuration]
    VV -->|API Management| ZZ[API Integration Management]
    VV -->|Logout| AAA[End Session]
    
    %% RFID Attendance Flow
    BBB[RFID Tag Scanned] --> CCC{Tag Valid?}
    CCC -->|No| DDD[Log Invalid Tag]
    CCC -->|Yes| EEE[Identify User]
    EEE --> FFF{User Found?}
    FFF -->|No| GGG[Log Unknown User]
    FFF -->|Yes| HHH[Check Schedule]
    HHH --> III{Class in Session?}
    III -->|No| JJJ[Log Out of Schedule]
    III -->|Yes| KKK[Record Attendance]
    KKK --> LLL[Update Database]
    LLL --> MMM[Generate Notification]
    MMM --> NNN[Send Email Alert]
    NNN --> OOO[Send Web Notification]
    
    %% Manual Attendance Flow
    X --> PPP{Select Student}
    PPP --> QQQ{Student Present?}
    QQQ -->|Yes| RRR[Mark Present]
    QQQ -->|No| SSS[Mark Absent]
    RRR --> TTT[Update Attendance Record]
    SSS --> TTT
    TTT --> UUU[Save to Database]
    UUU --> VVV[Generate Report]
    
    %% Report Generation Flow
    V --> WWW{Report Type?}
    WWW -->|Daily| XXX[Generate Daily Report]
    WWW -->|Weekly| YYY[Generate Weekly Report]
    WWW -->|Monthly| ZZZ[Generate Monthly Report]
    WWW -->|Custom| AAAA[Generate Custom Report]
    XXX --> BBBB[Format Report]
    YYY --> BBBB
    ZZZ --> BBBB
    AAAA --> BBBB
    BBBB --> CCCC{Export Format?}
    CCCC -->|PDF| DDDD[Export as PDF]
    CCCC -->|Excel| EEEE[Export as Excel]
    CCCC -->|CSV| FFFF[Export as CSV]
    
    %% Notification System Flow
    MMM --> GGGG{Notification Type?}
    GGGG -->|Absence Alert| HHHH[Send Absence Email]
    GGGG -->|Attendance Confirmation| IIII[Send Confirmation]
    GGGG -->|System Alert| JJJJ[Send System Alert]
    HHHH --> KKKK[Email System]
    IIII --> KKKK
    JJJJ --> KKKK
    OOO --> LLLL[Web Notification System]
    
    %% Database Operations Flow
    LLL --> MMMM[Prisma ORM]
    MMMM --> NNNN[PostgreSQL Database]
    NNNN --> OOOO[Commit Transaction]
    OOOO --> PPPP[Update Cache]
    PPPP --> QQQQ[Log Operation]
    
    %% System Monitoring Flow
    XX --> RRRR{System Status?}
    RRRR -->|Healthy| SSSS[Continue Monitoring]
    RRRR -->|Warning| TTTT[Send Warning Alert]
    RRRR -->|Critical| UUUU[Send Critical Alert]
    TTTT --> VVVV[Admin Notification]
    UUUU --> VVVV
    VVVV --> WWWW[System Log]
    
    %% Backup System Flow
    WW --> XXXX{Scheduled Backup?}
    XXXX -->|Yes| YYYY[Start Backup Process]
    XXXX -->|Manual| YYYY
    YYYY --> ZZZZ[Encrypt Data]
    ZZZZ --> AAAAA[Compress Backup]
    AAAAA --> BBBBB[Store Backup]
    BBBBB --> CCCCC[Verify Backup]
    CCCCC --> DDDDD[Log Backup Status]
    
    %% End Points
    P --> END[End]
    Z --> END
    HH --> END
    RR --> END
    AAA --> END
    
    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef notification fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class A,END startEnd
    class B,D,E,F,G,H,K,S,CC,KK,UU,BBB,LLL,KKK,TTT,BBBB,MMMM,YYYY process
    class C,I,Q,AA,II,SS,L,T,DD,LL,VV,CCC,FFF,III,QQQ,WWW,GGGG,RRRR,XXXX decision
    class NNNN,WWWW,DDDDD database
    class MMM,OOO,NNN,HHHH,IIII,JJJJ notification
    class J,R,BB,JJ,TT,DDD,GGG,JJJ error
```

## Detailed Process Flowcharts

### 1. Authentication Flow

```mermaid
flowchart TD
    A1[User Enters Credentials] --> B1[Validate Input]
    B1 --> C1{Input Valid?}
    C1 -->|No| D1[Show Validation Error]
    C1 -->|Yes| E1[Check Database]
    E1 --> F1{User Exists?}
    F1 -->|No| G1[Show Invalid Credentials]
    F1 -->|Yes| H1[Verify Password]
    H1 --> I1{Password Correct?}
    I1 -->|No| J1[Show Invalid Credentials]
    I1 -->|Yes| K1[Check Account Status]
    K1 --> L1{Account Active?}
    L1 -->|No| M1[Show Account Disabled]
    L1 -->|Yes| N1[Generate Session Token]
    N1 --> O1[Log Login Activity]
    O1 --> P1[Redirect to Dashboard]
    
    D1 --> A1
    G1 --> A1
    J1 --> A1
    M1 --> A1
```

### 2. RFID Attendance Processing Flow

```mermaid
flowchart TD
    A2[RFID Tag Detected] --> B2[Read Tag Data]
    B2 --> C2[Validate Tag Format]
    C2 --> D2{Tag Valid?}
    D2 -->|No| E2[Log Invalid Tag]
    D2 -->|Yes| F2[Query User Database]
    F2 --> G2{User Found?}
    G2 -->|No| H2[Log Unknown Tag]
    G2 -->|Yes| I2[Check User Status]
    I2 --> J2{User Active?}
    J2 -->|No| K2[Log Inactive User]
    J2 -->|Yes| L2[Get Current Time]
    L2 --> M2[Check Class Schedule]
    M2 --> N2{Class in Session?}
    N2 -->|No| O2[Log Out of Schedule]
    N2 -->|Yes| P2[Check Attendance Status]
    P2 --> Q2{Already Marked?}
    Q2 -->|Yes| R2[Log Duplicate Entry]
    Q2 -->|No| S2[Record Attendance]
    S2 --> T2[Update Database]
    T2 --> U2[Generate Notification]
    U2 --> V2[Send Email Alert]
    V2 --> W2[Send Web Notification]
    W2 --> X2[Log Success]
    
    E2 --> END2[End]
    H2 --> END2
    K2 --> END2
    O2 --> END2
    R2 --> END2
    X2 --> END2
```

### 3. Report Generation Flow

```mermaid
flowchart TD
    A3[User Requests Report] --> B3[Validate Permissions]
    B3 --> C3{User Authorized?}
    C3 -->|No| D3[Show Access Denied]
    C3 -->|Yes| E3[Select Report Parameters]
    E3 --> F3[Query Database]
    F3 --> G3[Process Data]
    G3 --> H3[Apply Filters]
    H3 --> I3[Calculate Statistics]
    I3 --> J3[Format Report]
    J3 --> K3{Export Required?}
    K3 -->|No| L3[Display Report]
    K3 -->|Yes| M3[Select Export Format]
    M3 --> N3{Format Type?}
    N3 -->|PDF| O3[Generate PDF]
    N3 -->|Excel| P3[Generate Excel]
    N3 -->|CSV| Q3[Generate CSV]
    O3 --> R3[Download File]
    P3 --> R3
    Q3 --> R3
    L3 --> S3[Log Report Access]
    R3 --> S3
    
    D3 --> END3[End]
    S3 --> END3
```

### 4. Notification System Flow

```mermaid
flowchart TD
    A4[Event Triggered] --> B4[Check Notification Rules]
    B4 --> C4{Notification Required?}
    C4 -->|No| D4[Skip Notification]
    C4 -->|Yes| E4[Get Recipient List]
    E4 --> F4[Load Notification Template]
    F4 --> G4[Personalize Content]
    G4 --> H4{Notification Type?}
    H4 -->|Email| I4[Send Email]
    H4 -->|Web| J4[Send Web Notification]
    H4 -->|Both| K4[Send Both]
    I4 --> L4[Email System]
    J4 --> M4[Web Notification System]
    K4 --> L4
    K4 --> M4
    L4 --> N4[Log Email Sent]
    M4 --> O4[Log Web Notification]
    N4 --> P4[Update Delivery Status]
    O4 --> P4
    P4 --> Q4[Store in Notification History]
    
    D4 --> END4[End]
    Q4 --> END4
```

### 5. System Backup Flow

```mermaid
flowchart TD
    A5[Backup Triggered] --> B5{Trigger Type?}
    B5 -->|Scheduled| C5[Check Schedule]
    B5 -->|Manual| D5[Start Backup]
    C5 --> E5{Time to Backup?}
    E5 -->|No| F5[Wait]
    E5 -->|Yes| D5
    D5 --> G5[Prepare Backup]
    G5 --> H5[Stop Write Operations]
    H5 --> I5[Create Database Snapshot]
    I5 --> J5[Encrypt Data]
    J5 --> K5[Compress Backup]
    K5 --> L5[Upload to Storage]
    L5 --> M5[Verify Backup Integrity]
    M5 --> N5{Backup Valid?}
    N5 -->|No| O5[Log Backup Failure]
    N5 -->|Yes| P5[Resume Write Operations]
    P5 --> Q5[Update Backup Log]
    Q5 --> R5[Send Success Notification]
    
    F5 --> C5
    O5 --> END5[End]
    R5 --> END5
```

## System Flowchart Key Features

### 1. **Multi-User Authentication Flow**
- Separate login processes for different user types
- Comprehensive validation and error handling
- Session management and security logging

### 2. **RFID Attendance Processing**
- Automatic tag detection and validation
- Real-time attendance recording
- Duplicate entry prevention
- Schedule-based validation

### 3. **Comprehensive Reporting System**
- Multiple report types and formats
- Permission-based access control
- Export functionality in various formats
- Audit logging for report access

### 4. **Notification Management**
- Event-driven notification system
- Multiple delivery channels (Email & Web)
- Template-based personalization
- Delivery status tracking

### 5. **System Administration**
- Automated backup procedures
- System health monitoring
- Security configuration management
- API integration management

### 6. **Database Operations**
- Prisma ORM integration
- PostgreSQL database management
- Transaction handling
- Cache management

## Benefits of This Flowchart Design

1. **Clear Process Visualization**: Easy to understand system workflows
2. **Decision Point Identification**: Clear branching logic and conditions
3. **Error Handling**: Comprehensive error scenarios and recovery
4. **Scalable Architecture**: Modular design for easy maintenance
5. **Security Integration**: Authentication and authorization at each step
6. **Audit Trail**: Complete logging and monitoring capabilities
7. **User-Centric Design**: Focuses on user interactions and needs

This System Flowchart provides a complete view of how the ICCT Smart Attendance System processes data, handles user interactions, and manages system operations, making it easy for stakeholders to understand the system's logical flow and identify potential areas for optimization or enhancement.
