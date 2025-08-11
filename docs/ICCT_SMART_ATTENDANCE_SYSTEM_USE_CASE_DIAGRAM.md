# ICCT Smart Attendance System - Use Case Diagram

## Overview
This document presents a comprehensive Use Case Diagram for the ICCT Smart Attendance System, showing all major actors and their interactions with the system.

## Use Case Diagram

```plantuml
@startuml ICCT_Smart_Attendance_System_Use_Case_Diagram

!define RECTANGLE class

skinparam actorStyle awesome
skinparam usecase {
    BackgroundColor LightBlue
    BorderColor DarkBlue
    ArrowColor DarkBlue
}

title ICCT Smart Attendance System - Use Case Diagram

' Actors
actor "Student" as Student
actor "Instructor" as Instructor
actor "Parent/Guardian" as Parent
actor "Admin" as Admin
actor "System Administrator" as SysAdmin
actor "RFID Reader" as RFIDReader
actor "Email System" as EmailSystem
actor "External API" as ExternalAPI

' System Boundary
rectangle "ICCT Smart Attendance System" {
    
    ' Authentication & Security Use Cases
    usecase "Login to System" as UC1
    usecase "Logout from System" as UC2
    usecase "Reset Password" as UC3
    usecase "Manage User Profile" as UC4
    usecase "Change Password" as UC5
    usecase "View Dashboard" as UC6
    
    ' RFID & Attendance Use Cases
    usecase "Scan RFID Tag" as UC7
    usecase "Record Attendance" as UC8
    usecase "View Attendance History" as UC9
    usecase "Generate Attendance Report" as UC10
    usecase "Export Attendance Data" as UC11
    usecase "Manage RFID Tags" as UC12
    usecase "Manage RFID Readers" as UC13
    
    ' Student-Specific Use Cases
    usecase "View Personal Attendance" as UC14
    usecase "View Class Schedule" as UC15
    usecase "View Course Information" as UC16
    usecase "Receive Notifications" as UC17
    
    ' Instructor-Specific Use Cases
    usecase "View Class Attendance" as UC18
    usecase "Manage Class Schedule" as UC19
    usecase "Generate Class Reports" as UC20
    usecase "View Student List" as UC21
    usecase "Mark Manual Attendance" as UC22
    usecase "View Teaching Schedule" as UC23
    
    ' Parent-Specific Use Cases
    usecase "View Child Attendance" as UC24
    usecase "Receive Absence Alerts" as UC25
    usecase "View Academic Progress" as UC26
    usecase "Update Contact Information" as UC27
    
    ' Admin Use Cases
    usecase "Manage Users" as UC28
    usecase "Manage Departments" as UC29
    usecase "Manage Courses" as UC30
    usecase "Manage Subjects" as UC31
    usecase "Manage Instructors" as UC32
    usecase "Manage Students" as UC33
    usecase "Manage Parents" as UC34
    usecase "Manage Rooms" as UC35
    usecase "Manage Schedules" as UC36
    usecase "View System Analytics" as UC37
    usecase "Generate System Reports" as UC38
    usecase "Manage System Settings" as UC39
    usecase "View Audit Logs" as UC40
    usecase "Manage Roles & Permissions" as UC41
    
    ' System Administrator Use Cases
    usecase "Manage System Backups" as UC42
    usecase "Monitor System Health" as UC43
    usecase "Manage Security Settings" as UC44
    usecase "View System Logs" as UC45
    usecase "Manage API Integrations" as UC46
    usecase "Configure Notifications" as UC47
    usecase "Manage Database" as UC48
    usecase "Perform System Maintenance" as UC49
    
    ' Notification Use Cases
    usecase "Send Email Notifications" as UC50
    usecase "Send Web Notifications" as UC51
    usecase "Manage Notification Templates" as UC52
    usecase "Schedule Notifications" as UC53
    
    ' Analytics & Reporting Use Cases
    usecase "Generate Analytics Reports" as UC54
    usecase "View Real-time Analytics" as UC55
    usecase "Export Reports" as UC56
    usecase "View Performance Metrics" as UC57
    
    ' External System Use Cases
    usecase "Sync External Data" as UC58
    usecase "Process Webhooks" as UC59
    usecase "API Data Exchange" as UC60
}

' Student Relationships
Student --> UC1
Student --> UC2
Student --> UC3
Student --> UC4
Student --> UC5
Student --> UC6
Student --> UC14
Student --> UC15
Student --> UC16
Student --> UC17

' Instructor Relationships
Instructor --> UC1
Instructor --> UC2
Instructor --> UC3
Instructor --> UC4
Instructor --> UC5
Instructor --> UC6
Instructor --> UC18
Instructor --> UC19
Instructor --> UC20
Instructor --> UC21
Instructor --> UC22
Instructor --> UC23
Instructor --> UC17

' Parent Relationships
Parent --> UC1
Parent --> UC2
Parent --> UC3
Parent --> UC4
Parent --> UC5
Parent --> UC6
Parent --> UC24
Parent --> UC25
Parent --> UC26
Parent --> UC27
Parent --> UC17

' Admin Relationships
Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC28
Admin --> UC29
Admin --> UC30
Admin --> UC31
Admin --> UC32
Admin --> UC33
Admin --> UC34
Admin --> UC35
Admin --> UC36
Admin --> UC37
Admin --> UC38
Admin --> UC39
Admin --> UC40
Admin --> UC41
Admin --> UC17

' System Administrator Relationships
SysAdmin --> UC1
SysAdmin --> UC2
SysAdmin --> UC3
SysAdmin --> UC4
SysAdmin --> UC5
SysAdmin --> UC6
SysAdmin --> UC42
SysAdmin --> UC43
SysAdmin --> UC44
SysAdmin --> UC45
SysAdmin --> UC46
SysAdmin --> UC47
SysAdmin --> UC48
SysAdmin --> UC49
SysAdmin --> UC17

' RFID Reader Relationships
RFIDReader --> UC7
RFIDReader --> UC8

' Email System Relationships
EmailSystem --> UC50

' External API Relationships
ExternalAPI --> UC58
ExternalAPI --> UC59
ExternalAPI --> UC60

' Include Relationships
UC8 ..> UC7 : <<include>>
UC8 ..> UC50 : <<include>>
UC8 ..> UC51 : <<include>>
UC25 ..> UC50 : <<include>>
UC17 ..> UC51 : <<include>>
UC38 ..> UC54 : <<include>>
UC37 ..> UC55 : <<include>>
UC20 ..> UC10 : <<include>>
UC42 ..> UC48 : <<include>>

' Extend Relationships
UC50 ..> UC52 : <<extend>>
UC51 ..> UC52 : <<extend>>
UC53 ..> UC50 : <<extend>>
UC53 ..> UC51 : <<extend>>
UC56 ..> UC54 : <<extend>>
UC57 ..> UC55 : <<extend>>

@enduml
```

## Actor Descriptions

### Primary Actors
1. **Student**: End users who attend classes and have RFID tags for attendance tracking
2. **Instructor**: Faculty members who teach classes and manage student attendance
3. **Parent/Guardian**: Legal guardians who monitor their children's attendance and academic progress
4. **Admin**: Administrative staff who manage the overall system operations
5. **System Administrator**: Technical staff responsible for system maintenance and configuration

### Secondary Actors
6. **RFID Reader**: Hardware device that scans RFID tags and sends data to the system
7. **Email System**: External email service for sending notifications
8. **External API**: Third-party systems that integrate with the attendance system

## Use Case Categories

### 1. Authentication & Security
- **Login to System**: All users must authenticate to access the system
- **Logout from System**: Secure session termination
- **Reset Password**: Password recovery functionality
- **Manage User Profile**: Update personal information
- **Change Password**: Password modification
- **View Dashboard**: Access to personalized dashboard

### 2. RFID & Attendance Management
- **Scan RFID Tag**: Automatic attendance recording via RFID
- **Record Attendance**: Store attendance data in the system
- **View Attendance History**: Access historical attendance records
- **Generate Attendance Report**: Create attendance reports
- **Export Attendance Data**: Export data in various formats
- **Manage RFID Tags**: Administer RFID tag assignments
- **Manage RFID Readers**: Configure and monitor RFID readers

### 3. Student-Specific Functions
- **View Personal Attendance**: Students can see their own attendance records
- **View Class Schedule**: Access to class timetables
- **View Course Information**: Course details and materials
- **Receive Notifications**: Get alerts about attendance and academic matters

### 4. Instructor-Specific Functions
- **View Class Attendance**: Monitor student attendance in their classes
- **Manage Class Schedule**: Update and modify class schedules
- **Generate Class Reports**: Create reports for their classes
- **View Student List**: Access roster of enrolled students
- **Mark Manual Attendance**: Override RFID attendance when needed
- **View Teaching Schedule**: Access their teaching timetable

### 5. Parent-Specific Functions
- **View Child Attendance**: Monitor their children's attendance
- **Receive Absence Alerts**: Get notified when children are absent
- **View Academic Progress**: Access academic performance data
- **Update Contact Information**: Maintain current contact details

### 6. Administrative Functions
- **Manage Users**: Create, update, and delete user accounts
- **Manage Departments**: Handle department information
- **Manage Courses**: Administer course offerings
- **Manage Subjects**: Handle subject information
- **Manage Instructors**: Administer instructor accounts
- **Manage Students**: Handle student records
- **Manage Parents**: Administer parent accounts
- **Manage Rooms**: Handle classroom assignments
- **Manage Schedules**: Coordinate class schedules
- **View System Analytics**: Access system-wide analytics
- **Generate System Reports**: Create comprehensive reports
- **Manage System Settings**: Configure system parameters
- **View Audit Logs**: Monitor system activities
- **Manage Roles & Permissions**: Control access rights

### 7. System Administration
- **Manage System Backups**: Handle data backup operations
- **Monitor System Health**: Track system performance
- **Manage Security Settings**: Configure security parameters
- **View System Logs**: Access system logs
- **Manage API Integrations**: Handle external integrations
- **Configure Notifications**: Set up notification systems
- **Manage Database**: Handle database operations
- **Perform System Maintenance**: Conduct system maintenance

### 8. Notification System
- **Send Email Notifications**: Deliver notifications via email
- **Send Web Notifications**: Deliver in-app notifications
- **Manage Notification Templates**: Create and edit notification templates
- **Schedule Notifications**: Set up automated notifications

### 9. Analytics & Reporting
- **Generate Analytics Reports**: Create analytical reports
- **View Real-time Analytics**: Access live analytics data
- **Export Reports**: Export reports in various formats
- **View Performance Metrics**: Access performance indicators

### 10. External System Integration
- **Sync External Data**: Synchronize with external systems
- **Process Webhooks**: Handle incoming webhook data
- **API Data Exchange**: Exchange data via APIs

## Key Features Highlighted

### 1. **Multi-Role Access Control**
- Different access levels for different user types
- Role-based permissions and restrictions
- Secure authentication and authorization

### 2. **Automated Attendance Tracking**
- RFID-based automatic attendance recording
- Manual attendance override capabilities
- Real-time attendance monitoring

### 3. **Comprehensive Reporting**
- Multiple report types for different stakeholders
- Export capabilities in various formats
- Real-time analytics and dashboards

### 4. **Notification System**
- Email notifications for important events
- Web-based in-app notifications
- Configurable notification templates

### 5. **System Management**
- Complete user and data management
- System monitoring and maintenance
- Backup and recovery procedures

### 6. **Integration Capabilities**
- API-based external system integration
- Webhook support for real-time updates
- Data synchronization with external systems

## Benefits of This Use Case Design

1. **Comprehensive Coverage**: All major system functions are represented
2. **Clear Actor Responsibilities**: Each actor has well-defined roles and permissions
3. **Scalable Architecture**: Easy to extend with new use cases
4. **Security-First Approach**: Authentication and authorization are primary concerns
5. **User-Centric Design**: Focuses on user needs and workflows
6. **System Integration Ready**: Supports external system connections
7. **Maintainable Structure**: Clear separation of concerns and responsibilities

This Use Case Diagram provides a complete view of the ICCT Smart Attendance System's functionality, showing how different users interact with the system and what capabilities are available to each user type.
