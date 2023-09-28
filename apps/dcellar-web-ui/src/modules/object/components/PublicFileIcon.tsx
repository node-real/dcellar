// Use fillcolor props to set svg icon color
function PublicFileIcon({
  fillColor,
  w = 20,
  h = 20,
}: {
  fillColor: string;
  w?: number;
  h?: number;
}) {
  return (
    <svg width={w} height={h} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="earth">
        <path
          id="Vector"
          d="M10 1.25C5.17523 1.25 1.25 5.17523 1.25 10C1.25 14.8248 5.17523 18.75 10 18.75C14.8248 18.75 18.75 14.8248 18.75 10C18.75 5.17523 14.8248 1.25 10 1.25ZM16.152 13.64C15.7624 13.3229 15.2588 12.9628 14.8816 12.8549C14.2369 12.6707 13.7763 11.4274 13.0395 11.5655C12.3026 11.7037 12.3949 13.4996 12.2105 14.1444C12.0264 14.7891 10.783 14.8352 10.3224 15.2036C10.012 15.4519 9.97359 16.4956 9.98157 17.1494C6.04743 17.1395 2.85027 13.936 2.85027 9.99967C2.85027 7.04127 4.65626 4.49696 7.22395 3.41079C6.99648 4.39642 6.62873 5.92932 6.43128 6.43062C6.13194 7.19044 7.4214 8.84828 7.4214 8.84828L6.90387 11.1969C6.90387 11.1969 8.75698 11.9338 9.58585 10.4141C10.4147 8.89428 10.7831 10.2299 11.2897 9.99957C11.7963 9.76928 11.0134 6.56104 11.2897 6.0928C11.5229 5.69751 14.0871 5.17622 14.963 4.8573C15.8813 5.74374 16.5634 6.87323 16.905 8.14079C16.3769 8.48303 14.8817 8.15741 14.6055 8.82513C14.3294 9.4921 15.9291 10.1697 17.15 10.0369C17.143 11.3512 16.7798 12.5829 16.1521 13.6397L16.152 13.64Z"
          fill="#1184EE"
        />
      </g>
    </svg>
  );
}

export default PublicFileIcon;