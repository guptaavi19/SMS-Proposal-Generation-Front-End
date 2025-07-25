import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Loader2 } from "lucide-react";
import { ClientOnly } from "remix-utils/client-only";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { http } from "~/lib/utils";
import { GetSectionsResponse, Section, User } from "~/types";
import JoditEditor from "~/components/jodit.client";
import { useEffect, useState } from "react";
import { marked } from "marked";
import { Button } from "~/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "~/hooks/use-auth";

type Params = {
  projectId: string;
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  let sections: Section[] = [];
  const { projectId } = params as Params;

  try {
    const res = await http.get<GetSectionsResponse>(
      `/projects/${projectId}/sections`
    );

    sections = res.data.data.sections;
  } catch (e) {
    console.log(e);
  }

  return {
    projectId,
    sections,
  };
};

const Page = () => {
  const { projectId, sections } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>("");
  const auth = useAuth();
  const [role, setRole] = useState<User["role"] | null>(null);
  const powerAutomateMutation = useMutation({
    mutationFn: async ({ htmlContent }: { htmlContent: string }) => {
      const formData = new FormData();
      formData.append("html_content", htmlContent);

      await http.post(`/projects/${projectId}/send-to-automate`, formData);
    },
    onSuccess: () => {
      toast.success("Generating Word Document.");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  useEffect(() => {
    if (sections) {
      setContent(
        sections
          .map((section) => {
          let buf = section.response;
         return (
              `<h1 style="font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 12px;">${section.displayName}</h1>` +
              buf
            );
          })
          .join("<p><br><table>")
      );
    }
  }, [sections]);

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get<{ role: User["role"] }>(
          `/users/${!auth.user?.email}/role`
        );
        setRole(res.data.role);
      } catch (e) {}
    })();
  }, [auth]);

  return (
    <div className="grid grid-cols-12 min-h-screen p-4 gap-4 bg-slate-200">
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <div>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
              <CardTitle className="text-center text-2xl">
                Report Overview
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-8">
              <ClientOnly
                fallback={
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin h-10 w-10" />
                  </div>
                }
              >
                {() => (
                  <div>
                    <JoditEditor
                      value={content}
                      config={{
                        readonly: true,
                      }}
                    />
                  </div>
                )}
              </ClientOnly>
            </div>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <div>
                {role === "originator" ? (
                  <Button>Submit for Approval</Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={powerAutomateMutation.isPending}
                    onClick={() => {
                      powerAutomateMutation.mutate({ htmlContent: content });
                    }}
                  >
                    {powerAutomateMutation.isPending
                      ? "Generating"
                      : "Generate Word Document"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
