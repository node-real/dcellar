import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@node-real/uikit';
import Link from 'next/link';

type Props = { name: string };

export const AccountBreadCrumb = ({ name = 'Account Detail' }: Props) => {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="/accounts" as={Link}>
          Accounts
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink href="#">{name}</BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumb>
  );
};
