const { faker } = require('@faker-js/faker');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { exec } = require('child_process');

const YAML_PATH = path.join(__dirname, 'ProductService.yaml');

function generateProduct(id) {
  const discountType = faker.helpers.arrayElement(['percentage', 'fixed']);
  const discountValue = discountType === 'percentage'
    ? faker.number.float({ min: 5, max: 50, precision: 0.1 })
    : faker.number.float({ min: 10, max: 300, precision: 0.01 });

  return {
    id: id.toString(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.float({ min: 10, max: 1500, precision: 0.01 }),
    stock: faker.number.int({ min: 1, max: 200 }),
    categoryId: faker.string.uuid(),
    images: [
      {
        url: faker.image.urlPicsumPhotos({ width: 600, height: 400 }),
        altText: faker.commerce.productAdjective() + " view"
      }
    ],
    discountType,
    discountValue,
    discountStart: faker.date.soon({ days: 10 }).toISOString(),
    discountEnd: faker.date.soon({ days: 20 }).toISOString(),
    isFeatured: faker.datatype.boolean(),
    salesCount: faker.number.int({ min: 0, max: 500 })
  };
}

function updateYamlWithExamples(products) {
  const doc = yaml.load(fs.readFileSync(YAML_PATH, 'utf8'));

  const getProductsPath = doc.paths?.['/products']?.get;
  if (!getProductsPath) {
    console.error("❌ /products GET path not found in YAML.");
    return;
  }

  getProductsPath.responses['200'].content['application/json'].examples = {
    generated: {
      summary: "Generated product list",
      value: products
    }
  };

  const newYaml = yaml.dump(doc, { lineWidth: -1 });
  fs.writeFileSync(YAML_PATH, newYaml, 'utf8');
  console.log('✅ YAML file updated with generated examples.');
}

function runPrismMock() {
  const command = `npx prism mock ${YAML_PATH} -p 4010`;
  console.log(`🚀 Starting Prism server on http://localhost:4010 ...`);
  const prismProcess = exec(command);

  prismProcess.stdout.pipe(process.stdout);
  prismProcess.stderr.pipe(process.stderr);
}

// Main flow
const products = Array.from({ length: 10 }, (_, i) => generateProduct(100 + i));
updateYamlWithExamples(products);
runPrismMock();
