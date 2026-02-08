export default function randomString(
  length: number = 8,
  mode: "default" | "url" = "default",
): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const urlChars = `${characters}.-_`;
  let result = "";
  if (mode === "default")
    for (let i = 0; i < length; i++)
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
  else if (mode === "url")
    for (let i = 0; i < length; i++)
      result += urlChars.charAt(Math.floor(Math.random() * urlChars.length));

  return result;
}
