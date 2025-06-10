import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { http } from "~/lib/utils";
import { Customer, Project, Section } from "~/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";

type ProjectWithCustomer = Project & {
  customer: Customer;
};

export const loader = async () => {
  let projects: ProjectWithCustomer[] = [];

  try {
    const [projectsRes, customersRes] = await Promise.all([
      http.get<{ data: { projects: Project[] } }>("/projects"),
      http.get<{ data: { customers: Customer[] } }>("/customers"),
    ]);

    let projectsBuf: Project[] = projectsRes.data.data.projects;
    let customers = customersRes.data.data.customers;

    for (let i = 0; i < projectsBuf.length; ++i) {
      let customer: Customer;

      for (let j = 0; j < customers.length; ++j) {
        if (projectsBuf[i].customerId === customers[j].id) {
          customer = customers[j];
        }
      }

      projects.push({
        id: projectsBuf[i].id,
        customerId: projectsBuf[i].customerId,
        reportType: projectsBuf[i].reportType,
        name: projectsBuf[i].name,
        number: projectsBuf[i].number,
        location: projectsBuf[i].location,
        originator: projectsBuf[i].originator,
        reviewer: projectsBuf[i].reviewer,
        approver: projectsBuf[i].approver,
        content: projectsBuf[i].content,
        createdAt: projectsBuf[i].createdAt,
        updatedAt: projectsBuf[i].updatedAt,
        sections: projectsBuf[i].sections,
        customer: customer!,
      });
    }
  } catch (e) {}

  return {
    projects,
  };
};

const Page = () => {
  const { projects } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-auto py-8 bg-slate-200">
      <div className="container mx-auto mt-24">
        <Card className="mx-auto">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Select a Project</CardTitle>
            <Link to="/" className={buttonVariants()}>
              New Project
            </Link>
          </CardHeader>
          <CardContent>
            <div>
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
              />
            </div>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Project Location</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects
                  .slice(0, searchQuery ? projects.length : 3)
                  .map((project, i) => {
                    if (
                      searchQuery &&
                      !project.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    ) {
                      return null;
                    }

                    return (
                      <TableRow key={i}>
                        <TableCell>{project.id}</TableCell>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{project.location}</TableCell>
                        <TableCell>{project.customer.name}</TableCell>
                        <TableCell>{project.reportType.displayName}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={async () => {
                              const res = await http.get<{
                                data: { sections: Section[] };
                              }>(`/projects/${project.id}/sections`);

                              navigate(
                                `/projects/${project.id}/sections/${res.data.data.sections[0].id}`
                              );
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
