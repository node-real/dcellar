import styled from '@emotion/styled';

export const Loading = ({ fill = '#00BA34', size = 32 }: { fill?: string; size?: number }) => {
  return (
    <Icon
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.5 13C23.5 14.3789 23.2284 15.7443 22.7007 17.0182C22.1731 18.2921 21.3996 19.4496 20.4246 20.4246C19.4496 21.3996 18.2921 22.1731 17.0182 22.7007C15.7443 23.2284 14.3789 23.5 13 23.5C11.6211 23.5 10.2557 23.2284 8.98182 22.7007C7.7079 22.1731 6.55039 21.3996 5.57538 20.4246C4.60036 19.4496 3.82694 18.2921 3.29926 17.0182C2.77159 15.7443 2.5 14.3789 2.5 13C2.5 11.6211 2.77159 10.2557 3.29927 8.98182C3.82694 7.7079 4.60037 6.55039 5.57538 5.57538C6.5504 4.60036 7.70791 3.82694 8.98183 3.29926C10.2557 2.77159 11.6211 2.5 13 2.5C14.3789 2.5 15.7443 2.77159 17.0182 3.29927C18.2921 3.82694 19.4496 4.60037 20.4246 5.57538C21.3996 6.5504 22.1731 7.70791 22.7007 8.98183C23.2284 10.2557 23.5 11.6211 23.5 13L23.5 13Z"
        stroke={fill}
        strokeOpacity="0.1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 2.5C14.3789 2.5 15.7443 2.77159 17.0182 3.29927C18.2921 3.82694 19.4496 4.60036 20.4246 5.57538C21.3996 6.55039 22.1731 7.70791 22.7007 8.98183C23.2284 10.2557 23.5 11.6211 23.5 13"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
};

const Icon = styled.svg`
  margin: auto;
  animation: rotation 1s infinite linear;

  @keyframes rotation {
    from {
      transform: rotateZ(0deg);
    }

    to {
      transform: rotateZ(360deg);
    }
  }
`;
