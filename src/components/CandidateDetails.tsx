import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  FileText, 
  Clock, 
  IndianRupee,
  MapPin,
  GraduationCap,
  Award,
  MessageSquare
} from 'lucide-react';
import { Candidate } from './CandidateDropdown';

interface CandidateDetailsProps {
  candidate: Candidate | null;
}

const getFieldIcon = (fieldName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Name': <User className="h-4 w-4" />,
    'Email': <Mail className="h-4 w-4" />,
    'Phone Number': <Phone className="h-4 w-4" />,
    'Job Role Admin': <Briefcase className="h-4 w-4" />,
    'Job Role Candidate': <Briefcase className="h-4 w-4" />,
    'Call Datetime': <Calendar className="h-4 w-4" />,
    'Transcript': <FileText className="h-4 w-4" />,
    'Summary': <FileText className="h-4 w-4" />,
    'Candidate Intro': <MessageSquare className="h-4 w-4" />,
    'Experience Type': <Briefcase className="h-4 w-4" />,
    'Past Experience': <Clock className="h-4 w-4" />,
    'Project or Achievements': <Award className="h-4 w-4" />,
    'Total Experience (Years)': <Clock className="h-4 w-4" />,
    'Current CTC': <IndianRupee className="h-4 w-4" />,
    'Notice Period Status': <Clock className="h-4 w-4" />,
    'Notice Period Remaining (Months)': <Clock className="h-4 w-4" />,
    'Has Basic Knowledge': <GraduationCap className="h-4 w-4" />,
    'Internship or Academic': <GraduationCap className="h-4 w-4" />,
    'Joining Availability': <Calendar className="h-4 w-4" />,
    'Joining Date': <Calendar className="h-4 w-4" />,
    'Willing to Relocate': <MapPin className="h-4 w-4" />,
    'Interview Availability': <Calendar className="h-4 w-4" />,
    'Call Status': <Phone className="h-4 w-4" />,
    'Interview Status': <Calendar className="h-4 w-4" />,
    'Communication Level': <MessageSquare className="h-4 w-4" />,
    'Overall Explanation': <FileText className="h-4 w-4" />
  };
  
  return iconMap[fieldName] || <FileText className="h-4 w-4" />;
};

const getFieldVariant = (fieldName: string, value: string) => {
  // Status-based coloring
  if (fieldName.toLowerCase().includes('status')) {
    if (value.toLowerCase().includes('completed') || value.toLowerCase().includes('passed')) {
      return 'success';
    }
    if (value.toLowerCase().includes('pending') || value.toLowerCase().includes('scheduled')) {
      return 'warning';
    }
    if (value.toLowerCase().includes('failed') || value.toLowerCase().includes('rejected')) {
      return 'destructive';
    }
  }
  
  // Boolean-like values
  if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'true') {
    return 'success';
  }
  if (value.toLowerCase() === 'no' || value.toLowerCase() === 'false') {
    return 'secondary';
  }
  
  return 'default';
};

const formatFieldValue = (fieldName: string, value: string) => {
  // Format different field types
  if (fieldName === 'Current CTC' && value) {
    // Parse the value and format as Indian currency
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
    if (!isNaN(numericValue)) {
      // Convert to INR formatting with lakhs
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numericValue);
      return `${formatted} per month`;
    }
    return value.includes('₹') ? value : `₹${value}`;
  }
  
  if (fieldName.includes('Date') && value) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      // Return original value if date parsing fails
    }
  }
  
  return value;
};

const isLongTextField = (fieldName: string) => {
  const longTextFields = [
    'Summary',
    'Transcript', 
    'Overall Explanation',
    'Candidate Intro',
    'Past Experience',
    'Project or Achievements'
  ];
  return longTextFields.includes(fieldName);
};

const getFieldDisplayOrder = () => {
  return [
    'Phone Number',
    'Job Role Admin',
    'Call Datetime',
    'Experience Type',
    'Candidate Intro',
    'Past Experience',
    'Project or Achievements',
    'Total Experience (Years)',
    'Current CTC',
    'Notice Period Status',
    'Joining Availability',
    'Willing to Relocate',
    'Interview Availability',
    'Call Status',
    'Interview Status',
    'Interview Reminder Email',
    'Reminder Email Date',
    'Call Count',
    'Communication Level',
    'Overall Explanation',
    'Summary',
    'Call Recording'
  ];
};

export const CandidateDetails: React.FC<CandidateDetailsProps> = ({ candidate }) => {
  if (!candidate) {
    return (
      <Card className="p-8 bg-surface border-card-border shadow-sm">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Candidate Selected</h3>
          <p className="text-muted-foreground">
            Please select a candidate from the dropdown above to view their details.
          </p>
        </div>
      </Card>
    );
  }

  // Filter out empty fields and sort by display order
  const fieldDisplayOrder = getFieldDisplayOrder();
  const filledFields = Object.entries(candidate)
    .filter(([_, value]) => value && value.toString().trim() !== '')
    .sort(([fieldA], [fieldB]) => {
      const indexA = fieldDisplayOrder.indexOf(fieldA);
      const indexB = fieldDisplayOrder.indexOf(fieldB);
      
      // If field is not in order list, put it at the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });

  if (filledFields.length === 0) {
    return (
      <Card className="p-8 bg-surface border-card-border shadow-sm">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            This candidate has no filled information in the database.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Key Info */}
      <Card className="p-6 bg-surface border-card-border shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-light rounded-lg">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {candidate.Name || 'Unknown Candidate'}
            </h2>
            <p className="text-muted-foreground mb-3">
              {candidate.Email || 'No email provided'}
            </p>
            {candidate['Job Role Admin'] && (
              <Badge variant="secondary" className="text-xs">
                {candidate['Job Role Admin']}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filledFields.map(([fieldName, value]) => {
          if (fieldName === 'Name' || fieldName === 'Email' || fieldName === 'Job Role Admin') {
            return null; // Skip fields already shown in header
          }

          const isLongText = value.toString().length > 100;
          const formattedValue = value.toString();

          return (
            <Card 
              key={fieldName} 
              className={cn(
                "p-4 bg-surface border-card-border shadow-sm hover:shadow-md transition-all duration-fast hover:border-border-hover",
                isLongText && "md:col-span-2 lg:col-span-3"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">
                  {getFieldIcon(fieldName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {fieldName}
                  </h4>
                  {fieldName === 'Call Recording' && formattedValue ? (
                    <a 
                      href={formattedValue} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark hover:underline transition-colors"
                    >
                      🔗 Click to listen
                    </a>
                  ) : isLongText || isLongTextField(fieldName) ? (
                    <div className="max-h-32 overflow-y-auto bg-background rounded-md p-3 border border-card-border">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {formattedValue}
                      </p>
                    </div>
                  ) : (
                    <Badge 
                      variant={getFieldVariant(fieldName, value.toString())}
                      className="text-xs"
                    >
                      {formattedValue}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}