![](https://images.prismic.io/andrewzigler/5271ff8a-093f-40ed-a08f-8a2fb3d7764e_zigmud.jpg?ixlib=gatsbyFP&auto=compress%2Cformat&fit=max&q=50&rect=0%2C0%2C1200%2C628&w=1200&h=628)

# zigmud *\*\*(deprecated)\*\**

> Experimental fork of [RanvierMUD/trpg-skeleton](https://github.com/RanvierMUD/trpg-skeleton) powered by an experimental fork of [RanvierMUD/core](https://github.com/azigler/core)

### Instructions

1. Get a checkout of this experimental fork ([azigler/zigmud](https://github.com/azigler/zigmud))
2. Get a checkout of the experimental core:develop branch ([azigler/core:develop](https://github.com/azigler/core/tree/develop))
3. In your checkout of [azigler/core:develop](https://github.com/azigler/core/tree/develop), run `npm install` then `npm link`
4. In your checkout of [azigler/zigmud](https://github.com/azigler/zigmud), run `npm link ranvier`

**Whenever you run `npm install` or `npm update` in your [azigler/zigmud](https://github.com/azigler/zigmud) checkout, you must re-run `npm link ranvier` to re-establish the link.**

### Bundles

The following is a list of Ranvier bundles I have created with this project:

- [ranvier-webhooks](https://github.com/azigler/ranvier-webhooks)
