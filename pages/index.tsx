import { GetServerSideProps } from "next";
import React from "react";
import LoginPage from "../components/LoginPage";
import WholeUI from "../components/WholeUI";
import { authorize } from "../util/oauth";

export default function Index(props) {
  if (!props.authenticated) {
    return <LoginPage onLogin={authorize} />;
  }

  return (
    <WholeUI me={props.me} token={props.token} timeline={props.timeline} />
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  let token;

  try {
    token = JSON.parse(decodeURIComponent(req.cookies.token) || "{}");
  } catch {}

  if (token) {
    const twitterRequestOptions = {
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
    };

    const me = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
      twitterRequestOptions
    )
      .then((r) => r.json())
      .then((r) => r.data);

    if (!me) {
      return { props: { authenticated: false } };
    }

    const timeline = await fetch(
      `https://api.twitter.com/2/users/${me.id}/timelines/reverse_chronological?tweet.fields=created_at&expansions=author_id&user.fields=profile_image_url,id,username&max_results=100`,
      twitterRequestOptions
    )
      .then((r) => r.json())
      .then((r) =>
        r.data.map((tweet: any) => ({
          ...tweet,
          author: r.includes.users.find(
            (user: any) => user.id === tweet.author_id
          ),
        }))
      );

    return {
      props: {
        authenticated: true,
        token: token.value,
        expiresAt: token.expiresAt,
        me,
        timeline,
      },
    };
  }

  return { props: { authenticated: false } };
};
