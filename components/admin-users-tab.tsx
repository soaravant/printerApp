import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Printer, Search, Users, Church, MapPin, CreditCard, RotateCcw } from "lucide-react";
import { roundMoney, getDynamicFilterOptions } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AdminUsersTabProps {
  users: any[];
  usersTabSearchTerm: string;
  setUsersTabSearchTerm: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  filteredUsers: any[];
  formatPrice: (n: number) => string;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  usersTabSearchTerm,
  setUsersTabSearchTerm,
  roleFilter,
  setRoleFilter,
  teamFilter,
  setTeamFilter,
  filteredUsers,
  formatPrice,
}) => {
  const router = useRouter();

  // Function to get the appropriate icon based on user role
  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case "Άτομο":
        return <User className="h-4 w-4" />;
      case "Ομάδα":
        return <Users className="h-4 w-4" />;
      case "Ναός":
        return <Church className="h-4 w-4" />;
      case "Τομέας":
        return <MapPin className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Function to get responsible users for Άτομο users based on their team membership
  const getResponsibleUsers = (userData: any) => {
    const allUsers = users
    const responsibleUsers: string[] = []
    
    // For Άτομο users with "Χρήστης" access level, find their team's responsible person
    if (userData.userRole === "Άτομο" && userData.accessLevel === "Χρήστης" && userData.memberOf && userData.memberOf.length > 0) {
      // Find the team the user is a member of
      const userTeam = userData.memberOf.find((member: string) => {
        const teamAccount = allUsers.find((user: any) => 
          user.userRole === "Ομάδα" && user.displayName === member
        )
        return teamAccount
      })
      
      if (userTeam) {
        // Find the team account
        const teamAccount = allUsers.find((user: any) => 
          user.userRole === "Ομάδα" && user.displayName === userTeam
        )
        
        if (teamAccount) {
          // Get the responsible persons for this team using the dynamic computation
          const teamResponsiblePersons = getDynamicResponsiblePersons(teamAccount)
          responsibleUsers.push(...teamResponsiblePersons)
        }
      }
    }
    
    return responsibleUsers
  }

  // Function to dynamically compute responsible persons for Ομάδα/Ναός/Τομέας
  const getDynamicResponsiblePersons = (userData: any) => {
    const allUsers = users
    const responsibleUsers: string[] = []
    
    // Only compute for Ομάδα, Ναός, and Τομέας
    if (userData.userRole === "Ομάδα" || userData.userRole === "Ναός" || userData.userRole === "Τομέας") {
      const ypefthynoiUsers = allUsers.filter((user: any) => user.accessLevel === "Υπεύθυνος")
      
      ypefthynoiUsers.forEach((ypefthynos: any) => {
        if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
          const isResponsible = ypefthynos.responsibleFor.some((responsibleFor: string) => {
            return responsibleFor === userData.displayName
          })
          
          if (isResponsible) {
            responsibleUsers.push(ypefthynos.displayName)
          }
        }
      })
    }
    
    return responsibleUsers
  }

  const handleUserCardClick = (userData: any) => {
    // Navigate to profile page with user data using parameterized URL
    router.push(`/profile/${userData.uid}`);
  };

  return (
    <div>
      {/* Filters UI */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Αναζήτηση χρηστών..."
                value={usersTabSearchTerm}
                onChange={(e) => setUsersTabSearchTerm(e.target.value)}
                className="pl-10 !focus:outline-none !focus:ring-0 !focus:border-gray-300 !focus-visible:ring-0 !focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <div className="w-full md:w-60 flex items-center">
            <Select value={teamFilter} onValueChange={(value) => {
              // Reset role filter to "all" if current role is "Ναός" or "Τομέας" and a specific team is selected
              if ((roleFilter === "Ναός" || roleFilter === "Τομέας") && value !== "all") {
                setRoleFilter("all");
              }
              setTeamFilter(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Όλες οι ομάδες" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλες οι ομάδες</SelectItem>
                {(() => {
                  const { teams } = getDynamicFilterOptions(users);
                  return teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-60 flex items-center">
            <Select value={roleFilter} onValueChange={(value) => {
              // Reset team filter to "all" if current team is specific and role is "Ναός" or "Τομέας"
              if ((value === "Ναός" || value === "Τομέας") && teamFilter !== "all") {
                setTeamFilter("all");
              }
              setRoleFilter(value);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
                <SelectItem value="Άτομο">Άτομο</SelectItem>
                <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                <SelectItem value="Ναός">Ναός</SelectItem>
                <SelectItem value="Τομέας">Τομέας</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Επαναφορά φίλτρων"
              className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition flex items-center justify-center"
              onClick={() => {
                setUsersTabSearchTerm("");
                setRoleFilter("all");
                setTeamFilter("all");
              }}
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Εμφανίζονται {filteredUsers.length} από {users.length} χρήστες
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => {
          // Use the actual debt fields from user data
          const totalDebt = userData.totalDebt || 0;
          // When total is negative (credit), categories should display as 0
          const printDebt = totalDebt < 0 ? 0 : (userData.printDebt || 0);
          const laminationDebt = totalDebt < 0 ? 0 : (userData.laminationDebt || 0);
          return (
            <Card 
              key={userData.uid} 
              className="hover:shadow-lg transition-shadow flex flex-col h-full cursor-pointer hover:bg-gray-50"
              onClick={() => handleUserCardClick(userData)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(userData.userRole)}
                    {userData.displayName}
                  </div>
                  <Badge 
                    className={
                      userData.accessLevel === "Διαχειριστής" 
                        ? "bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" 
                        : userData.accessLevel === "Υπεύθυνος" 
                        ? "bg-black text-white hover:bg-gray-800" 
                        : "bg-gray-500 text-white hover:bg-gray-600"
                    }
                  >
                    {userData.accessLevel === "Διαχειριστής" ? "Διαχειριστής" : userData.accessLevel === "Υπεύθυνος" ? "Υπεύθυνος" : "Χρήστης"}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {userData.userRole}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Χρήστης (ID):</span>
                    <span className="font-mono">{userData.username}</span>
                  </div>


                </div>

                {/* Tag System Display */}
                {userData.userRole === "Άτομο" && userData.memberOf && userData.memberOf.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Μέλος:</span>
                    <div className="flex flex-wrap gap-1">
                      {userData.memberOf.map((member: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic responsible persons display for Ομάδα/Ναός/Τομέας */}
                {(userData.userRole === "Ομάδα" || userData.userRole === "Ναός" || userData.userRole === "Τομέας") && (() => {
                  const dynamicResponsiblePersons = getDynamicResponsiblePersons(userData)
                  return (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Υπεύθυνοι:</span>
                      <div className="flex flex-wrap gap-1">
                        {dynamicResponsiblePersons.length > 0 ? (
                          dynamicResponsiblePersons.map((responsible: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {responsible}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">Δεν έχει ανατεθεί Υπεύθυνος</span>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Responsible persons display for Άτομο users */}
                {userData.userRole === "Άτομο" && userData.accessLevel === "Χρήστης" && (() => {
                  const responsibleUsers = getResponsibleUsers(userData)
                  return (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Υπεύθυνοι:</span>
                      <div className="flex flex-wrap gap-1">
                        {responsibleUsers.length > 0 ? (
                          responsibleUsers.map((responsible: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {responsible}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">Δεν έχει ανατεθεί Υπεύθυνος</span>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {userData.accessLevel === "Υπεύθυνος" && userData.responsibleFor && userData.responsibleFor.length > 0 && (
                  <div className="space-y-2">
                                            <span className="text-sm font-medium text-gray-700">Υπεύθυνος για:</span>
                    <div className="flex flex-wrap gap-1">
                      {userData.responsibleFor.map((responsibleFor: string, index: number) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {responsibleFor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show debts for Χρήστης and Υπεύθυνος access levels */}
                {(userData.accessLevel === "Χρήστης" || userData.accessLevel === "Υπεύθυνος") && (
                  <div className="border-t pt-4 mt-auto">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Οφειλές</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Εκτυπώσεις:
                        </span>
                        <span className={printDebt > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {formatPrice(printDebt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Πλαστικοποιήσεις:
                        </span>
                        <span className={laminationDebt > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {formatPrice(laminationDebt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-medium">Σύνολο:</span>
                        <span className={totalDebt > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                          {totalDebt > 0 ? formatPrice(totalDebt) : totalDebt < 0 ? `-${formatPrice(Math.abs(totalDebt))}` : formatPrice(totalDebt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 