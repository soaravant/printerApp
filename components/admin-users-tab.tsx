import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Printer, Search, Users, Church, MapPin, CreditCard } from "lucide-react";
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
  dummyDB: any;
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
  dummyDB,
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

  // Function to get responsible users based on current user's role and members
  const getResponsibleUsers = (userData: any) => {
    const allUsers = dummyDB.getUsers()
    const responsibleUsers: string[] = []
    
    // For users with "user" access level, find their team's responsible person through memberOf field
    if (userData.accessLevel === "user" && userData.memberOf && userData.memberOf.length > 0) {
      // Find the first team in the memberOf list and get its responsible person
      const firstTeam = userData.memberOf.find((member: string) => {
        const teamAccount = allUsers.find((user: any) => 
          user.userRole === "Ομάδα" && user.displayName === member
        )
        return teamAccount && teamAccount.responsiblePerson
      })
      
      if (firstTeam) {
        const teamAccount = allUsers.find((user: any) => 
          user.userRole === "Ομάδα" && user.displayName === firstTeam
        )
        
        if (teamAccount && teamAccount.responsiblePerson) {
          responsibleUsers.push(teamAccount.responsiblePerson)
          return responsibleUsers
        }
      }
    }
    
    // For other cases (admin, Υπεύθυνος, or users without members), use the old logic
    const ypefthynoiUsers = allUsers.filter((user: any) => user.accessLevel === "Υπεύθυνος")
    
    ypefthynoiUsers.forEach((ypefthynos: any) => {
      if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
        const isResponsible = ypefthynos.responsibleFor.some((responsibleFor: string) => {
          return responsibleFor === userData.displayName || 
                 responsibleFor === userData.userRole
        })
        
        if (isResponsible) {
          responsibleUsers.push(ypefthynos.displayName)
        }
      }
    })
    
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
                className="pl-10"
              />
            </div>
          </div>
          {(roleFilter === "all" || roleFilter === "Άτομο") && (
            <div className="w-full md:w-60 flex items-center">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
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
          )}
          <div className="w-full md:w-60 flex items-center">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Εμφανίζονται {filteredUsers.length} από {users.length} χρήστες
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => {
          // Use the actual debt fields from user data
          const printDebt = userData.printDebt || 0;
          const laminationDebt = userData.laminationDebt || 0;
          const totalDebt = userData.totalDebt || 0;
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
                      userData.accessLevel === "admin" 
                        ? "bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" 
                        : userData.accessLevel === "Υπεύθυνος" 
                        ? "bg-black text-white hover:bg-gray-800" 
                        : "bg-gray-500 text-white hover:bg-gray-600"
                    }
                  >
                    {userData.accessLevel === "admin" ? "Διαχειριστής" : userData.accessLevel === "Υπεύθυνος" ? "Υπεύθυνος" : "User"}
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

                {/* Direct responsiblePersons display for Τομείς and Ναοί */}
                {(userData.userRole === "Τομέας" || userData.userRole === "Ναός") && userData.responsiblePersons && userData.responsiblePersons.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Υπεύθυνοι:</span>
                    <div className="flex flex-wrap gap-1">
                      {userData.responsiblePersons.map((responsible: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {responsible}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ομάδα responsiblePersons display */}
                {userData.userRole === "Ομάδα" && userData.responsiblePersons && userData.responsiblePersons.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Υπεύθυνοι:</span>
                    <div className="flex flex-wrap gap-1">
                      {userData.responsiblePersons.map((responsible: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {responsible}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback for Άτομο users - use the complex logic */}
                {userData.userRole === "Άτομο" && (() => {
                  const responsibleUsers = getResponsibleUsers(userData)
                  return responsibleUsers.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Υπεύθυνοι:</span>
                      <div className="flex flex-wrap gap-1">
                        {responsibleUsers.map((responsible: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {responsible}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null
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

                {/* Show debts for user and Υπεύθυνος access levels */}
                {(userData.accessLevel === "user" || userData.accessLevel === "Υπεύθυνος") && (
                  <div className="border-t pt-4 mt-auto">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Οφειλές</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Εκτυπώσεις:
                        </span>
                        <span className={printDebt > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {printDebt > 0 ? formatPrice(printDebt) : printDebt < 0 ? `-${formatPrice(Math.abs(printDebt))}` : formatPrice(printDebt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Πλαστικοποιήσεις:
                        </span>
                        <span className={laminationDebt > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {laminationDebt > 0 ? formatPrice(laminationDebt) : laminationDebt < 0 ? `-${formatPrice(Math.abs(laminationDebt))}` : formatPrice(laminationDebt)}
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